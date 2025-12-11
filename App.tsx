import React, { useState, useEffect } from 'react';
import { DeviceAnalysis, DeviceControl, ControlCategory, AppStatus, Language, Theme } from './types';
import { fileToBase64 } from './utils';
import { analyzeDeviceImage } from './services/geminiService';
import { AccessibleButton } from './components/AccessibleButton';
import { DetailView } from './components/DetailView';
import { PriorityPanel } from './components/PriorityPanel';
import { ChatModal } from './components/ChatModal';
import { FeedbackModal } from './components/FeedbackModal';
import { LiveAssistant } from './components/LiveAssistant';
import { getTranslation } from './utils/translations';
import { speak, stopSpeech, unlockAudio } from './utils/speechUtils';

export default function App() {
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [analysis, setAnalysis] = useState<DeviceAnalysis | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedControl, setSelectedControl] = useState<DeviceControl | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Settings State
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('bright');
  const [ttsEnabled, setTtsEnabled] = useState(true); 

  // Initial greeting
  useEffect(() => {
    // Only on very first load
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited && ttsEnabled) {
       // Need user interaction usually, but some browsers allow if autoplay permitted
       sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);

  // GLOBAL ACTION HANDLER
  // Crucial: Speech triggers MUST happen here, synchronously with the click event.
  const handleAction = (labelKey: string, nextAction: () => void) => {
    unlockAudio(); // Try to wake up audio engine
    
    if (ttsEnabled) {
      stopSpeech();
      const text = getTranslation(lang, labelKey as any) || labelKey;
      speak(text, lang, true);
      
      // We give the speech a head start of 800ms before switching views
      // This ensures the user hears the confirmation before the UI might lag during render
      setTimeout(() => {
        nextAction();
      }, 800);
    } else {
      nextAction();
    }
  };

  // Special Handler for Entering Live Mode to ensure Intro plays
  const handleEnterLiveMode = () => {
    unlockAudio();
    if (ttsEnabled) {
        stopSpeech();
        // Speak the intro BEFORE mounting the heavy Live component
        speak(getTranslation(lang, 'startingLive'), lang, true);
        
        // Wait for the speech to be mostly done before starting the camera/connection
        setTimeout(() => {
            setStatus('LIVE');
        }, 1500); 
    } else {
        setStatus('LIVE');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    unlockAudio();
    if(ttsEnabled) speak(getTranslation(lang, 'thinking'), lang, true);
    setStatus('ANALYZING');
    
    try {
      const base64 = await fileToBase64(file);
      const fullImageSrc = `data:${file.type};base64,${base64}`;
      processImageAnalysis(base64, fullImageSrc);
    } catch (e) {
      handleAnalysisError(e);
    }
  };

  const processImageAnalysis = async (base64: string, fullImageSrc: string) => {
    setStatus('ANALYZING');
    setImageSrc(fullImageSrc); 
    
    try {
      const data = await analyzeDeviceImage(base64, 'image/jpeg', lang);
      setAnalysis(data);
      setStatus('SUCCESS');
      if(ttsEnabled) speak(getTranslation(lang, 'analysisComplete'), lang, true);
    } catch (e) {
      handleAnalysisError(e);
    }
  };

  const handleAnalysisError = (e: any) => {
    console.error(e);
    setStatus('ERROR');
    if(ttsEnabled) speak("Error. Please try again.", lang);
    alert("Analysis failed.");
    setStatus('IDLE');
  };

  const handleControlClick = (control: DeviceControl) => {
    unlockAudio();
    if(ttsEnabled) speak(control.label, lang, true);
    setSelectedControl(control);
  };

  const handleReset = () => {
    stopSpeech();
    setAnalysis(null);
    setImageSrc(null);
    setStatus('IDLE');
    setSelectedControl(null);
    if(ttsEnabled) speak(getTranslation(lang, 'mainMenu'), lang, true);
  };

  // Theme styles
  const isEyeCare = theme === 'eye-care';
  const mainBg = isEyeCare ? 'bg-[#1c1917]' : 'bg-slate-50';
  const headerBg = isEyeCare ? 'bg-stone-900 border-stone-800' : 'bg-white border-b border-slate-200';
  const headerShadow = isEyeCare ? '' : 'shadow-sm';

  const bgStyle = {
    backgroundImage: isEyeCare 
      ? 'radial-gradient(#44403c 1px, transparent 1px)' 
      : 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px), linear-gradient(to bottom right, #f8fafc, #f1f5f9)', 
    backgroundSize: isEyeCare ? '24px 24px' : '30px 30px, 100% 100%',
    backgroundBlendMode: 'normal'
  };

  // --- NEW COMPONENT: LARGE LANGUAGE SELECTOR ---
  const LargeLanguageSelector = () => {
    const languages: { code: Language; label: string; flag: string }[] = [
      { code: 'en', label: 'English', flag: '🇺🇸' },
      { code: 'zh', label: '中文', flag: '🇨🇳' },
      { code: 'es', label: 'Español', flag: '🇪🇸' }
    ];

    return (
      <div className="w-full grid grid-cols-3 gap-3 lg:gap-6 mb-2">
        {languages.map((item) => {
          const isActive = lang === item.code;
          return (
            <button
              key={item.code}
              onClick={() => {
                if (!isActive) {
                  unlockAudio();
                  setLang(item.code);
                  if (ttsEnabled) {
                     const msg = item.code === 'zh' ? "中文模式" : item.code === 'es' ? "Modo Español" : "English Mode";
                     speak(msg, item.code, true);
                  }
                }
              }}
              className={`
                relative flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-200
                border-2 shadow-sm
                ${isActive 
                  ? (isEyeCare ? 'bg-indigo-900 border-indigo-400 text-white shadow-lg scale-105 z-10' : 'bg-indigo-600 border-indigo-800 text-white shadow-lg scale-105 z-10') 
                  : (isEyeCare ? 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')
                }
              `}
            >
              {isActive && (
                <div className="absolute -top-3 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-xs shadow-sm">
                  ✓
                </div>
              )}
              <span className="text-3xl lg:text-4xl mb-1 filter drop-shadow-sm">{item.flag}</span>
              <span className={`text-sm lg:text-lg font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // Header
  const SettingsHeader = () => (
    <div className={`px-4 lg:px-6 py-4 flex flex-col gap-3 sticky top-0 z-40 transition-colors ${headerBg} ${headerShadow}`}>
       
       <div className="flex justify-between items-center w-full">
          {/* LEFT: Branding or Back Button */}
          <div className="flex items-center gap-2 shrink-0">
             {status !== 'IDLE' ? (
               <button 
                 onClick={() => handleAction('newPhoto', handleReset)}
                 className={`px-5 py-2.5 rounded-xl font-bold text-base lg:text-lg shadow-sm border flex items-center gap-2 transition-transform active:scale-95 ${isEyeCare ? 'bg-stone-700 text-stone-300 border-stone-600' : 'bg-white text-slate-700 border-slate-300'}`}
               >
                 <span>←</span>
                 <span>{getTranslation(lang, 'newPhoto')}</span>
               </button>
             ) : (
                <div className="flex items-center gap-3" onClick={() => { unlockAudio(); if(ttsEnabled) speak("AccessiTwin", lang); }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${isEyeCare ? 'bg-indigo-900 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    <span className="text-3xl">👁️</span>
                  </div>
                  <div className="hidden sm:block">
                     <span className={`font-black text-2xl block leading-none ${isEyeCare ? 'text-white' : 'text-slate-800'}`}>AccessiTwin</span>
                     <span className={`text-xs font-bold tracking-widest uppercase ${isEyeCare ? 'text-stone-400' : 'text-indigo-400'}`}>Senior Helper</span>
                  </div>
                </div>
             )}
          </div>

          {/* RIGHT: Controls (TTS & Theme) */}
          <div className="flex items-center gap-3">
             <button
               onClick={() => {
                  unlockAudio();
                  const newState = !ttsEnabled;
                  setTtsEnabled(newState);
                  speak(newState ? getTranslation(lang, 'ttsOn') : getTranslation(lang, 'ttsOff'), lang, true);
               }}
               className={`
                 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all active:scale-95 
                 ${isEyeCare ? 'bg-stone-800 border-stone-600' : 'bg-white border-slate-200'} 
                 ${ttsEnabled ? (isEyeCare ? 'text-green-400 border-green-900/50' : 'text-green-700 border-green-200 bg-green-50') : 'text-gray-400'}
               `}
             >
                <span className="text-xl">{ttsEnabled ? '🔊' : '🔇'}</span>
                <span className={`text-sm font-bold hidden sm:block`}>
                  {ttsEnabled ? 'Voice ON' : 'Voice OFF'}
                </span>
             </button>

             <button 
               onClick={() => {
                 unlockAudio();
                 const newTheme = theme === 'bright' ? 'eye-care' : 'bright';
                 const labelKey = newTheme === 'eye-care' ? 'themeEyeCare' : 'themeBright';
                 handleAction(labelKey, () => setTheme(newTheme));
               }}
               className={`
                 w-12 h-12 flex items-center justify-center rounded-xl text-2xl shadow-sm border transition-all active:rotate-12 active:scale-95
                 ${isEyeCare ? 'bg-stone-800 border-stone-600 text-yellow-300' : 'bg-white border-slate-200 text-orange-400'}
               `}
               aria-label="Toggle Theme"
             >
               {theme === 'bright' ? '☀️' : '🌙'}
             </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col ${mainBg}`} style={bgStyle}>
      {status === 'LIVE' ? (
        <LiveAssistant 
          onClose={handleReset} 
          onCaptureImage={() => {}} 
          lang={lang} 
          theme={theme}
          ttsEnabled={ttsEnabled} 
        />
      ) : (
        <>
          <SettingsHeader />
          
          <FeedbackModal 
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            lang={lang}
            theme={theme}
          />

          {(status === 'IDLE' || status === 'ANALYZING' || status === 'ERROR') && (
            <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4 lg:p-6 gap-6 animate-fade-in">
                 
                 {/* IDLE HERO SECTION */}
                 {status === 'IDLE' && (
                   <div className="w-full">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="text-2xl">🌍</span>
                        <h2 className={`text-sm font-bold uppercase tracking-widest ${isEyeCare ? 'text-stone-400' : 'text-slate-500'}`}>Select Language / 选择语言</h2>
                      </div>
                      <LargeLanguageSelector />
                   </div>
                 )}

                 <div className="flex-1 grid grid-rows-2 gap-4 lg:gap-6 min-h-[55vh]">
                    
                    {/* BUTTON 1: LIVE ASSISTANT */}
                    <button 
                       onClick={handleEnterLiveMode}
                       className={`
                          relative group rounded-[2.5rem] p-6 flex flex-row items-center justify-between gap-4 shadow-xl active:scale-95 transition-all border-b-[8px] overflow-hidden
                          ${isEyeCare 
                              ? 'bg-indigo-900 border-indigo-950 text-white' 
                              : 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-800 text-white'
                          }
                       `}
                    >
                        {/* Decorative Background Icon */}
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-20 transform rotate-12 pointer-events-none">📹</div>
                        
                        <div className="flex flex-col items-start text-left z-10">
                           <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-2">Real-time AI</div>
                           <h2 className="text-3xl lg:text-5xl font-black mb-1">{getTranslation(lang, 'liveAssistant')}</h2>
                           <p className="text-lg lg:text-xl opacity-90 font-medium">{getTranslation(lang, 'liveDesc')}</p>
                        </div>
                        
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30 z-10">
                           <span className="text-4xl lg:text-5xl animate-pulse">📹</span>
                        </div>
                    </button>

                    {/* BUTTON 2: PHOTO ANALYSIS */}
                    <label 
                       className={`
                          relative group rounded-[2.5rem] p-6 flex flex-row items-center justify-between gap-4 shadow-xl active:scale-95 transition-all border-b-[8px] cursor-pointer overflow-hidden
                          ${isEyeCare 
                              ? 'bg-stone-800 border-stone-900 text-yellow-100' 
                              : 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-800 text-white'
                          }
                       `}
                       onClick={() => { unlockAudio(); if(ttsEnabled) speak(getTranslation(lang, 'startingPhoto'), lang, true); }}
                    >
                        {/* Decorative Background Icon */}
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-20 transform -rotate-12 pointer-events-none">📸</div>

                        <div className="flex flex-col items-start text-left z-10">
                           <div className="bg-black/10 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-2">Static Analysis</div>
                           <h2 className="text-3xl lg:text-5xl font-black mb-1">{getTranslation(lang, 'takePhoto')}</h2>
                           <p className="text-lg lg:text-xl opacity-90 font-medium">{getTranslation(lang, 'intro')}</p>
                        </div>

                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-black/10 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10 z-10 group-hover:scale-110 transition-transform">
                           <span className="text-4xl lg:text-5xl">📸</span>
                        </div>

                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handleImageSelect}
                          className="hidden" 
                        />
                    </label>
                 </div>
            </div>
          )}

          {(status === 'SUCCESS' && selectedControl) && (
            <DetailView 
              control={selectedControl} 
              onBack={() => setSelectedControl(null)} 
              lang={lang}
              theme={theme}
            />
          )}

          {(status === 'SUCCESS' && analysis && !selectedControl) && (
            <>
              <MainListView 
                 analysis={analysis}
                 imageSrc={imageSrc}
                 handleControlClick={handleControlClick}
                 onOpenChat={() => setIsChatOpen(true)}
                 lang={lang}
                 theme={theme}
                 isEyeCare={isEyeCare}
              />
              <ChatModal 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                analysis={analysis}
                lang={lang}
                theme={theme}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

// Extracted for brevity - same as before
const MainListView = ({ analysis, imageSrc, handleControlClick, onOpenChat, lang, theme, isEyeCare }: any) => {
    // ... (unchanged)
    const textColor = isEyeCare ? 'text-yellow-100' : 'text-slate-800';
    const subTextColor = isEyeCare ? 'text-stone-400' : 'text-slate-500';
    const clipboardBg = isEyeCare ? 'bg-stone-900 border-stone-800' : 'bg-slate-800'; 
    const paperBg = isEyeCare ? 'bg-stone-800' : 'bg-white';
    const getPriorityScore = (cat: ControlCategory) => {
      switch (cat) {
        case ControlCategory.DANGER: return 0;
        case ControlCategory.PRIMARY: return 1;
        default: return 2;
      }
    };
    const sortedControls = [...analysis.controls].sort((a: DeviceControl, b: DeviceControl) => {
      return getPriorityScore(a.category) - getPriorityScore(b.category);
    });

    return (
      <div className="font-sans pb-20 flex-1 relative z-10 w-full animate-slide-up-fade">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 order-1 lg:sticky lg:top-24">
             <div className="mb-6 px-2">
                <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${subTextColor}`}>{getTranslation(lang, 'guideFor')}</p>
                <h1 className={`text-3xl font-black truncate leading-tight ${textColor}`}>{analysis.deviceName}</h1>
             </div>
             <PriorityPanel 
               analysis={analysis}
               imageSrc={imageSrc}
               onControlClick={handleControlClick} 
               onOpenChat={onOpenChat}
               lang={lang}
               theme={theme}
             />
          </div>
          <div className="lg:col-span-7 order-2 relative mt-4 lg:mt-0">
            <div className={`relative rounded-[20px] p-2 lg:p-4 shadow-2xl ${clipboardBg}`}>
              <div className={`relative rounded-[10px] min-h-[600px] p-6 lg:p-10 pt-16 shadow-inner z-10 ${paperBg}`}>
                <div className="flex items-center gap-3 mb-8 border-b-2 border-dashed border-gray-200 pb-4">
                  <span className="text-3xl filter grayscale opacity-80" aria-hidden="true">🏷️</span>
                  <h2 className={`text-xl font-bold uppercase tracking-widest ${subTextColor}`}>{getTranslation(lang, 'allControls')}</h2>
                </div>
                <div className="flex flex-col gap-6">
                  {sortedControls.map((control: DeviceControl) => (
                    <div key={control.id}>
                      <AccessibleButton control={control} onClick={handleControlClick} theme={theme} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}