// Utilities for handling Raw PCM Audio for Gemini Live API

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Simple Linear Interpolation Downsampler
// Converts any source sample rate (e.g., 44100, 48000) to target rate (16000)
export function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number = 16000): Float32Array {
  if (outputRate === inputRate) {
    return buffer;
  }
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const index1 = Math.floor(originalIndex);
    const index2 = Math.ceil(originalIndex);
    const t = originalIndex - index1;
    
    // Check bounds
    const val1 = buffer[index1] || 0;
    const val2 = buffer[index2] || val1; // Handle end edge case
    
    // Linear interpolation
    result[i] = val1 * (1 - t) + val2 * t;
  }
  return result;
}

// Convert Float32 audio to Int16 PCM
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

// Convert Int16 PCM from Gemini to AudioBuffer for playback
export function pcmToAudioBuffer(
  pcmData: ArrayBuffer, 
  audioContext: AudioContext, 
  sampleRate: number = 24000
): AudioBuffer {
  const int16Array = new Int16Array(pcmData);
  const float32Array = new Float32Array(int16Array.length);
  
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }

  const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Array);
  
  return audioBuffer;
}