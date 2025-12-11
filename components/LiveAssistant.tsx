
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';
import { arrayBufferToBase64, base64ToUint8Array, floatTo16BitPCM, pcmToAudioBuffer, downsampleBuffer } from '../utils/audioUtils';
import { stopSpeech, speak, unlockAudio } from '../utils/speechUtils';

interface Props {
  onClose: () => void;
  onCaptureImage: (base64: string) => void;
  lang: Language;
  theme: Theme;
  ttsEnabled: boolean;
}

export const LiveAssistant: React.FC<Props> = ({ onClose, lang, theme, ttsEnabled }) => {
  const isEyeCare = theme === 'eye-care';
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  
  // Default: Auto Listen ON (isMuted = false)
  const [isMuted, setIsMuted] = useState(false); 
  
  // Default: Fast Mode ON (Optimized for speed/safety by default)
  const [isFastMode, setIsFastMode] = useState(true); 
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isUserHolding, setIsUserHolding] = useState(false); 
  const [isThinking, setIsThinking] = useState(false); 
  
  // Granular Processing State
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'generating'>('analyzing');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); 
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const introPlayedRef = useRef(false);
  const reconnectTimeoutRef = useRef<any>(null);
  const isUnmountingRef = useRef(false);

  // Interaction Refs
  const lastSpeechTimeRef = useRef<number>(0);
  const isThinkingRef = useRef(false); 
  const isUserHoldingRef = useRef(false); 
  
  // Ref for stale closure prevention in audio processor
  const isMutedRef = useRef(false); 

  // Sync Ref with State
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Handle Granular Feedback
  useEffect(() => {
    let timeout: any;
    if (isThinking) {
      setProcessingStage('analyzing');
      timeout = setTimeout(() => {
        setProcessingStage('generating');
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [isThinking]);

  // --- SOUND EFFECTS (UI Only - No Background Noise) ---

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playTone = async (freq: number, type: 'sine' | 'square' | 'triangle' = 'sine', duration: number = 0.15) => {
      try {
        const ctx = await ensureAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = type;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
      } catch(e) { /* Ignore */ }
  };

  const playModeSwitchSound = (isFast: boolean) => {
      if (isFast) {
          playTone(600, 'sine', 0.1);
          setTimeout(() => playTone(800, 'sine', 0.1), 100);
      } else {
          playTone(800, 'sine', 0.1);
          setTimeout(() => playTone(600, 'sine', 0.1), 100);
      }
  };

  const playClickSound = () => playTone(400, 'triangle', 0.05);
  
  const playListeningCue = () => {
      playTone(880, 'sine', 0.3); // High ping
  };

  const setThinkingState = (thinking: boolean) => {
      if (thinking === isThinkingRef.current) return;
      isThinkingRef.current = thinking;
      setIsThinking(thinking);
  };

  // --- INTERACTION HANDLERS ---
  
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      // Ensure AudioContext is resumed on touch for Mobile
      ensureAudioContext();

      // Haptic Feedback: Subtle short vibration (15ms)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
      }

      // Interaction Logic: 
      // User intent: "I want to speak now."
      // Action: 
      // 1. Switch to Manual Mode (Mute = True) so AI stops auto-listening after this interaction.
      // 2. Stop any current TTS.
      // 3. Play cue.
      
      if (!isMutedRef.current) {
          setIsMuted(true); 
      }
      
      // Clear subtitles when user starts new interaction
      setSubtitle("");

      setIsUserHolding(true);
      isUserHoldingRef.current = true;
      playListeningCue();
      
      // Stop visual thinking, we are now "Inputting"
      setThinkingState(false);
      
      // Interrupt AI speech if happening
      if (aiSpeaking) {
           stopSpeech(); 
           // Clear audio queue if possible in future, for now just stopping TTS is helpful
           nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
      }
  };

  const handleTouchEnd = (e?: React.TouchEvent | React.MouseEvent) => {
      if (e) e.preventDefault();

      // Haptic Feedback: Stronger distinct vibration (50ms)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
      }

      setIsUserHolding(false);
      isUserHoldingRef.current = false;
      
      // Interaction Flow: User released button -> Assume they finished speaking -> Thinking
      if (!aiSpeaking) {
          setThinkingState(true);
      }
  };

  // --- SYSTEM PROMPT ---
  const getSystemInstruction = (fastModeActive: boolean) => {
    const langPrompt = lang === 'zh' ? "LANGUAGE: CHINESE (SIMPLIFIED). Speak Chinese." : "LANGUAGE: ENGLISH.";
    
    // Core Prompt logic
    // We enforce the "Filler" rule here to satisfy the "answer within 5s then analyze" requirement.
    const interactionRule = lang === 'zh' 
      ? `核心交互规则 (Latency Masking & Stateless):
      1. [Context Reset]: 将用户的每一次语音输入视为全新的、独立的请求。必须忽略之前对话中关于旧画面的内容。专注于**当前这一刻**看到的画面。
      2. 当用户展示物品并提问（如“这是什么？”）时，**必须**在1-2秒内先做出自然的回应（Filler），例如：“稍等，我仔细看一下...”、“好的，正在分析画面...”、“嗯，让我看看这是什么...”。
      3. 这是一个心理学技巧，用于填补视觉分析的空白期，让用户感觉反应很快 (< 5s)。
      4. 说完填充语后，**紧接着**详细描述分析结果。不要停顿太久。
      5. 使用高阶视觉分析能力，精准识别品牌、文字、细节。
      6. 语气要自然、亲切，像真人视频通话。`
      : `CORE INTERACTION RULE (Latency Masking & Stateless):
      1. [CONTEXT RESET]: Treat every user audio input as a FRESH, INDEPENDENT request. You MUST ignore previous conversation context regarding old frames. Focus ONLY on the **CURRENT** view immediately.
      2. When the user shows an item and asks a question (e.g., "What is this?"), you **MUST** respond within 2 seconds with a natural conversational filler (e.g., "Let me take a closer look...", "Hold on, analyzing the image...", "Hmm, let me see...").
      3. This is crucial to make the interaction feel immediate (< 5s) while you process the visual data.
      4. Immediately follow the filler with your detailed visual analysis.
      5. Maintain a natural, warm, empathetic vocal tone.
      6. Act as a high-intelligence visual assistant (AccessiTwin).`;

    const trackingAndOcrRule = lang === 'zh' 
      ? `
      核心能力增强 (视觉追踪 & OCR):
      1. [物体追踪]: 你必须时刻关注画面中心的物体。如果主要物体移出中心或被切断，必须发出简短指令纠正用户："往左移"、"抬高手机"、"离远一点"。确保物体在画面中央。
      2. [实时OCR]: 画面中一旦出现文字，请立即识别并朗读。如果是大段文字，先读标题再概括。无需用户提问，主动朗读可见文字。
      `
      : `
      CORE CAPABILITIES (Tracking & OCR):
      1. [OBJECT TRACKING]: Actively monitor the object in the center. If it drifts out of frame, command the user: "Move left", "Tilt up", "Pull back". Keep it centered.
      2. [LIVE OCR]: Immediately detect and read any visible text aloud. For blocks of text, read headers first. Do this proactively.
      `;

    if (fastModeActive) {
        return `
        ${langPrompt}
        ${interactionRule}
        ${trackingAndOcrRule}
        MODE: FAST RESPONSE.
        ROLE: Real-time visual cortex. 
        STYLE: Direct, confident, but always use the filler strategy for "What is this?" questions.
        PRIORITY: Safety, Obstacles, Navigation, Reading Text.
        `;
    }

    return `
    ${langPrompt}
    ${interactionRule}
    ${trackingAndOcrRule}
    MODE: HIGH INTELLIGENCE ASSISTANT (Gemini 3 Persona).
    ROLE: "AccessiTwin" - Advanced AI Helper.
    STYLE: Warm, patient, intelligent.
    CAPABILITIES: Deep visual understanding, OCR, scene description.
    `;
  };

  // --- LIFECYCLE & INTRO ---
  useEffect(() => {
    isUnmountingRef.current = false;
    unlockAudio();
    initializeSession(0, 'environment', isFastMode);

    if (ttsEnabled && !introPlayedRef.current) {
        introPlayedRef.current = true;
        const introEN = "Please show the item in the center of the screen and hold the screen to ask questions.";
        const introZH = "请将物品展示到画面中心，并按住屏幕提出问题。";
        setTimeout(() => speak(lang === 'zh' ? introZH : introEN, lang, true), 800);
    }

    return () => {
      isUnmountingRef.current = true;
      cleanup();
    };
  }, []); 

  const toggleCamera = async () => {
      playClickSound();
      const newMode = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(newMode);
      cleanup();
      setIsConnected(false);
      await initializeSession(0, newMode, isFastMode);
  };

  const cleanup = () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch(e) {}
        sessionRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
  };

  // --- CONNECTION LOGIC ---
  const initializeSession = async (retryCount = 0, cameraMode: 'user' | 'environment', fastModeOverride: boolean) => {
    if (isUnmountingRef.current) return;

    setError(null);
    if (retryCount === 0) setStatusMessage(lang === 'zh' ? "启动中..." : "Starting...");

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
        if (!isConnected && retryCount < 3) {
            console.warn("Watchdog timeout, retrying...");
            cleanup();
            initializeSession(retryCount + 1, cameraMode, fastModeOverride);
        } else if (!isConnected) {
             setError(lang === 'zh' ? "网络不稳定，正在重连..." : "Network unstable, reconnecting...");
        }
    }, 10000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true }, 
            video: { facingMode: cameraMode, width: 320, height: 240, frameRate: 15 } 
        });
        streamRef.current = stream;
      } catch(e) {
         setTimeout(() => initializeSession(retryCount, cameraMode, fastModeOverride), 1000);
         return; 
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }

      setStatusMessage(lang === 'zh' ? "连接大脑..." : "Connecting...");
      await ensureAudioContext();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: getSystemInstruction(fastModeOverride),
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            if (isUnmountingRef.current) return;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            setIsConnected(true);
            setStatusMessage("");
            startStreaming(stream!);
          },
          onmessage: (msg) => {
             if (isUnmountingRef.current) return;
             
             // Ensure AudioContext is running to play response
             if (audioContextRef.current?.state === 'suspended') {
                 audioContextRef.current.resume();
             }

             // Handle Text Transcription (Subtitles)
             const text = msg.serverContent?.outputTranscription?.text;
             if (text) {
                 setSubtitle(prev => prev + text);
             }

             const interrupted = msg.serverContent?.interrupted;
             if (interrupted) {
                 setSubtitle("");
             }

             // Data Received -> Model is answering -> Stop Thinking Animation
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                setThinkingState(false);
                setAiSpeaking(true);
                if (audioContextRef.current) {
                    const buffer = pcmToAudioBuffer(base64ToUint8Array(audioData).buffer, audioContextRef.current);
                    scheduleAudioChunk(buffer);
                }
             }
             
             if (msg.serverContent?.turnComplete) {
                 setThinkingState(false);
             }
          },
          onclose: () => {
              if (isUnmountingRef.current) return;
              setIsConnected(false);
              setThinkingState(false);
              console.log("Session closed, reconnecting...");
              setTimeout(() => initializeSession(0, cameraMode, fastModeOverride), 1000);
          },
          onerror: (err) => { 
             console.error(err);
             if (isUnmountingRef.current) return;
             setIsConnected(false);
             setThinkingState(false);
             const delay = Math.min(1000 * (retryCount + 1), 5000);
             setTimeout(() => initializeSession(retryCount + 1, cameraMode, fastModeOverride), delay);
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      if (!isUnmountingRef.current) {
          setTimeout(() => initializeSession(retryCount + 1, cameraMode, fastModeOverride), 3000);
      }
    }
  };

  const startStreaming = (stream: MediaStream) => {
      const inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isUnmountingRef.current) return;
        
        const isHolding = isUserHoldingRef.current; 
        const isMutedCurrent = isMutedRef.current; 
        
        let pcmData: ArrayBuffer;

        // --- CORE LOGIC FIX FOR "STUCK" STATE ---
        if (isMutedCurrent && !isHolding) {
            // Send Silence
            const silenceData = new Float32Array(e.inputBuffer.getChannelData(0).length).fill(0);
            const downsampledData = downsampleBuffer(silenceData, inputAudioCtx.sampleRate, 16000);
            pcmData = floatTo16BitPCM(downsampledData);
        } else {
            // Normal Audio Processing
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Client-side VAD for visual feedback only (Ripple effect)
            if (!isHolding) { 
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                const SPEECH_THRESHOLD = 0.04;

                if (rms > SPEECH_THRESHOLD) {
                    stopSpeech();
                    setThinkingState(false);
                    setSubtitle(""); // Clear subtitle if user speaks
                    lastSpeechTimeRef.current = Date.now();
                } else {
                    const timeSinceSpeech = Date.now() - lastSpeechTimeRef.current;
                    if (timeSinceSpeech > 800 && timeSinceSpeech < 5000 && !isThinkingRef.current && !aiSpeaking) {
                        if (lastSpeechTimeRef.current > 0) {
                            setThinkingState(true);
                        }
                    }
                }
            }

            const downsampledData = downsampleBuffer(inputData, inputAudioCtx.sampleRate, 16000);
            pcmData = floatTo16BitPCM(downsampledData);
        }
        
        sessionPromiseRef.current?.then(session => session.sendRealtimeInput({
            media: { mimeType: 'audio/pcm;rate=16000', data: arrayBufferToBase64(pcmData) }
        }));
      };
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
      
      const vidInterval = window.setInterval(() => {
        if (isUnmountingRef.current) return;
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = 320; 
            canvasRef.current.height = 240;
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ 
                media: { mimeType: 'image/jpeg', data: base64 } 
            }));
          }
        }
      }, 600); 

      sessionRef.current = { close: () => {
          clearInterval(vidInterval);
          source.disconnect();
          processor.disconnect();
          try { inputAudioCtx.close(); } catch(e) {}
      }};
  };

  const scheduleAudioChunk = (buffer: AudioBuffer) => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const start = Math.max(ctx.currentTime, nextStartTimeRef.current);
      source.start(start);
      nextStartTimeRef.current = start + buffer.duration;
      source.onended = () => {
          setAiSpeaking(false);
      };
  };

  const handleToggleFastMode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = !isFastMode;
    setIsFastMode(newMode);
    playModeSwitchSound(newMode); 
    if (ttsEnabled) {
        speak(newMode ? (lang === 'zh' ? "快速模式" : "Fast Mode") : (lang === 'zh' ? "详细智能模式" : "Intelligent Mode"), lang, true);
    }
    cleanup();
    setIsConnected(false);
    await initializeSession(0, facingMode, newMode);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      playClickSound(); 
      setIsMuted(!isMuted);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    stopSpeech();
    onClose();
  };

  const bgColor = isEyeCare ? 'bg-black' : 'bg-gray-900';

  // Helper text for granular feedback
  const getThinkingText = () => {
      if (processingStage === 'analyzing') {
          return lang === 'zh' ? "正在分析画面..." : "Analyzing Image...";
      }
      return lang === 'zh' ? "正在生成回答..." : "Generating Response...";
  };

  const getStatusText = () => {
      if (isUserHolding) return lang === 'zh' ? "👂 聆听中" : "👂 Listening";
      if (aiSpeaking) return "💬 Speaking";
      if (isThinking) return `👁️ ${getThinkingText()}`;
      if (isFastMode) return lang === 'zh' ? "⚡ 快速模式" : "⚡ FAST MODE";
      return "👂 Ready";
  };

  // --- ACCESSIBLE COLORS ---
  // EyeCare Mode: Yellow/Black (High Contrast standard)
  // Bright Mode: Royal Blue/White (Accessible, distinct from Cyan)
  const ocrScanColor = isEyeCare ? 'bg-yellow-400' : 'bg-blue-600';
  const ocrScanShadow = isEyeCare ? 'shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'shadow-[0_0_15px_rgba(37,99,235,0.8)]';
  const reticleBorder = isEyeCare ? 'border-yellow-400/80' : 'border-blue-600/80';
  const reticleCenter = isEyeCare ? 'bg-yellow-400/50' : 'bg-blue-600/50';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${bgColor}`}>
      <canvas ref={canvasRef} className="hidden" />
      
      {/* CSS for Scan Animation */}
      <style>{`
        @keyframes scan-vertical {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* TOP RIGHT: FAST MODE TOGGLE */}
      <div className="absolute top-4 right-4 z-[60]">
         <button 
           onClick={handleToggleFastMode}
           className={`w-16 h-16 rounded-full border-2 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${isFastMode ? 'bg-orange-600 border-orange-400' : 'bg-black/40 border-white/30 backdrop-blur'}`}
         >
           <span className="text-3xl">{isFastMode ? '⚡' : '🧠'}</span>
         </button>
      </div>

      {/* VIDEO FEED - INTERACTIVE AREA */}
      <div 
         className={`flex-1 relative overflow-hidden active:scale-[0.98] transition-transform duration-100 ${isUserHolding ? 'ring-4 ring-indigo-500' : ''}`}
         onMouseDown={handleTouchStart}
         onMouseUp={handleTouchEnd}
         onMouseLeave={handleTouchEnd}
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}
         onContextMenu={(e) => { e.preventDefault(); return false; }}
         style={{ 
             userSelect: 'none', 
             WebkitUserSelect: 'none', 
             WebkitTouchCallout: 'none' 
         }}
      >
        <video 
           ref={videoRef} 
           className={`absolute inset-0 w-full h-full object-cover opacity-80 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
           muted 
           playsInline 
        />
        
        {/* === OBJECT TRACKING RETICLE & OCR VISUAL === */}
        {/* This central box guides the user and simulates tracking/OCR focus */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 rounded-lg pointer-events-none z-10 flex flex-col items-center justify-center opacity-70 ${reticleBorder}`}>
            {/* Corners */}
            <div className={`absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-md ${reticleBorder}`}></div>
            <div className={`absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-md ${reticleBorder}`}></div>
            <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-md ${reticleBorder}`}></div>
            <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-md ${reticleBorder}`}></div>
            
            {/* Center Crosshair */}
            <div className={`w-2 h-2 rounded-full ${reticleCenter}`}></div>
            
            {/* OCR Scanning Line Animation - Always running to imply "Active Vision" */}
            <div 
                className={`absolute w-full h-[3px] ${ocrScanColor} ${ocrScanShadow}`}
                style={{ animation: 'scan-vertical 2.5s ease-in-out infinite' }}
            ></div>
            
            {/* Label */}
            <div className="absolute -bottom-8 px-2 py-1 bg-black/50 rounded text-xs font-bold text-white/70 tracking-widest">
                TRACKING + OCR
            </div>
        </div>

        {/* Thinking Overlay - Granular Feedback (Only shows when explicitly thinking to not block Reticle) */}
        {isThinking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-80 h-80 border rounded-full animate-ping duration-1000 ${isEyeCare ? 'border-yellow-500/20' : 'border-blue-400/20'}`}></div>
                <div className={`absolute top-20 bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl font-bold tracking-widest animate-pulse border flex flex-col items-center gap-2 ${isEyeCare ? 'text-yellow-200 border-yellow-500/30' : 'text-blue-100 border-blue-500/30'}`}>
                     <span className="text-xl">{processingStage === 'analyzing' ? '👁️' : '🧠'}</span>
                     <span className="text-sm">{getThinkingText()}`;</span>
                </div>
            </div>
        )}

        {/* Hold to Speak Overlay */}
        {isUserHolding && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none">
                 <div className="bg-indigo-600/90 text-white px-6 py-4 rounded-2xl text-2xl font-bold shadow-xl flex items-center gap-3 animate-pulse">
                     <span className="text-3xl">👂</span>
                     {lang === 'zh' ? "正在聆听..." : "Listening..."}
                 </div>
             </div>
        )}

        {/* Subtitles Overlay - REAL-TIME CAPTIONS */}
        {subtitle && (
            <div className="absolute bottom-28 left-4 right-4 text-center pointer-events-none z-20 animate-fade-in">
                <div className="inline-block bg-black/80 backdrop-blur-md px-6 py-4 rounded-2xl text-white text-xl lg:text-2xl font-bold leading-relaxed shadow-2xl border border-white/20 text-left">
                   <span className="text-cyan-400 text-sm font-bold uppercase block mb-1 tracking-wider">AI Output</span>
                   {subtitle}
                </div>
            </div>
        )}

        {/* Visual Hint Text - Hide when Speaking or Subtitle active */}
        <div 
            className={`absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10 transition-opacity duration-500 ease-in-out ${(!isUserHolding && !isThinking && !aiSpeaking && !subtitle) ? 'opacity-100' : 'opacity-0'}`}
        >
             <span className="px-4 py-2 bg-black/30 backdrop-blur-md rounded-full text-white/90 text-base font-medium border border-white/10 shadow-sm tracking-wide">
                {lang === 'zh' ? "按住屏幕和我沟通吧" : "Hold screen to communicate"}
             </span>
        </div>
        
        {/* Status Overlay */}
        <div className="absolute top-6 left-6 flex flex-col items-start gap-2 max-w-[70%] pointer-events-none">
             <div className={`px-4 py-3 rounded-xl text-xl font-bold shadow-lg backdrop-blur-md border-2 transition-all duration-300 ${isThinking ? 'bg-cyan-900/80 border-cyan-400 text-cyan-100' : (isFastMode ? 'bg-orange-600/90 border-orange-400 text-white' : 'bg-black/60 border-gray-500 text-white')}`}>
                {getStatusText()}
             </div>
             
             {!isConnected && (
                 <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse mt-2">
                     {statusMessage}
                 </div>
             )}
             {error && (
                 <div className="bg-red-800 text-white px-3 py-1 rounded text-sm font-bold mt-2 border border-red-500">
                     {error}
                 </div>
             )}
        </div>
      </div>

      {/* CONTROLS FOOTER */}
      <div className={`h-40 flex items-center px-4 pb-8 pt-4 gap-4 ${isEyeCare ? 'bg-stone-900' : 'bg-gray-100'}`}>
         
         {/* 1. MIC (LEFT) - Logic Updated: Auto starts ON, manual press turns it OFF. */}
         <button 
           onClick={handleToggleMute}
           className={`h-24 w-24 rounded-2xl flex flex-col items-center justify-center border-b-4 shadow-lg active:scale-95 transition-all ${isMuted ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-300 text-gray-800'}`}
         >
           <span className="text-4xl mb-1">{isMuted ? '🔇' : '🎙️'}</span>
           <span className="text-xs font-bold uppercase">{isMuted ? 'Auto: Off' : 'Auto: On'}</span>
         </button>

         {/* 2. EXIT (CENTER - LARGE) */}
         <button 
           onClick={handleClose}
           className="flex-1 h-28 rounded-3xl bg-red-600 border-b-8 border-red-800 flex items-center justify-center shadow-xl active:scale-95 active:border-b-0 active:translate-y-2 transition-all text-white gap-2"
         >
            <span className="text-5xl font-black">✕</span>
            <span className="text-2xl font-bold uppercase tracking-widest">{getTranslation(lang, 'close')}</span>
         </button>

         {/* 3. FLIP (RIGHT) */}
         <button 
           onClick={toggleCamera}
           className="h-24 w-24 rounded-2xl bg-white border-b-4 border-gray-300 text-gray-800 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
         >
           <span className="text-4xl mb-1">🔄</span>
           <span className="text-xs font-bold uppercase">{getTranslation(lang, 'flipCam')}</span>
         </button>

      </div>
    </div>
  );
};
