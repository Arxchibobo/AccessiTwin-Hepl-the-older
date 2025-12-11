import { Language } from '../types';

let synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voicesLoaded = false;

const loadVoices = () => {
  if (!synth) return;
  const voices = synth.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const unlockAudio = () => {
  if (!synth) return;
  if (synth.paused) synth.resume();
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  synth.speak(utterance);
};

export const speak = (text: string, lang: Language = 'en', force: boolean = false) => {
  if (!synth) return;

  if (force) {
    synth.cancel();
  }

  if (!voicesLoaded) {
    const voices = synth.getVoices();
    if (voices.length === 0) {
        setTimeout(() => speak(text, lang, force), 100);
        return;
    }
    voicesLoaded = true;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  // 0.9 is a softer, more gentle pace
  utterance.rate = 0.9; 
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = synth.getVoices();
  let selectedVoice = null;

  // Helper: Find voice by prioritizing specific female names
  const findVoice = (langCode: string, preferredNames: string[], excludedNames: string[] = []) => {
    // 1. Filter by language code (zh-CN, zh-TW, etc.)
    const langVoices = voices.filter(v => 
        v.lang.toLowerCase().includes(langCode) || 
        v.lang.replace('_', '-').toLowerCase().includes(langCode)
    );
    
    // 2. Exact match for Preferred Female Voices
    for (const name of preferredNames) {
      const match = langVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) return match;
    }

    // 3. Exclude known Male voices
    const safeVoices = langVoices.filter(v => 
        !excludedNames.some(ex => v.name.toLowerCase().includes(ex.toLowerCase()))
    );
    
    // 4. Prefer "Google" voices as fallback (usually higher quality/female on Android)
    const googleVoice = safeVoices.find(v => v.name.includes('Google'));
    
    return googleVoice || safeVoices[0];
  };

  switch (lang) {
    case 'zh':
      // Chinese Female Priority List
      // 'Google 汉语' / 'Google 普通话' (Android/Chrome - usually female)
      // 'Ting-Ting' (iOS standard female)
      // 'Microsoft Xiaoxiao' / 'Microsoft Yaoyao' (Windows/Edge)
      selectedVoice = findVoice('zh', 
        ['Google 汉语', 'Google 普通话', 'Google Chinese', 'Ting-Ting', 'Lili', 'Huihui', 'Yaoyao', 'Xiaoxiao', 'Meijia'], 
        ['Kangkang', 'Danny', 'Hanhan', 'Lisheng', 'Sin-Ji'] // Exclude Male
      );
      utterance.lang = 'zh-CN';
      break;
    case 'es':
      selectedVoice = findVoice('es', ['Google español', 'Monica', 'Paulina', 'Helena', 'Laura'], ['Jorge', 'Juan']);
      utterance.lang = 'es-ES';
      break;
    default:
      selectedVoice = findVoice('en', ['Google US English', 'Samantha', 'Zira', 'Ava', 'Susan'], ['Daniel', 'Fred']);
      utterance.lang = 'en-US';
      break;
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Chrome on Android sometimes gets stuck if we don't cancel previous speech
  if (synth.speaking) {
      synth.cancel();
      setTimeout(() => synth?.speak(utterance), 50);
  } else {
      synth.speak(utterance);
  }
};

export const stopSpeech = () => {
  if (synth) synth.cancel();
};