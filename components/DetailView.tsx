import React, { useEffect, useCallback } from 'react';
import { DeviceControl, Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  control: DeviceControl;
  onBack: () => void;
  lang: Language;
  theme: Theme;
}

export const DetailView: React.FC<Props> = ({ control, onBack, lang, theme }) => {
  const isEyeCare = theme === 'eye-care';
  
  const textColorPrimary = isEyeCare ? 'text-yellow-100' : 'text-stone-800';
  const textColorSecondary = isEyeCare ? 'text-stone-400' : 'text-stone-500';
  const bgCard = isEyeCare ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200';
  const backBtnBg = isEyeCare ? 'bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700' : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50';

  const speak = useCallback(() => {
    window.speechSynthesis.cancel();
    const textToRead = `${control.label}. ${control.detailText}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    if (lang === 'zh') utterance.lang = 'zh-CN';
    else if (lang === 'es') utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  }, [control, lang]);

  useEffect(() => {
    speak();
    return () => window.speechSynthesis.cancel();
  }, [speak]);

  return (
    <div className="flex flex-col min-h-screen p-6 lg:p-12 animate-slide-up-fade">
      <button 
        onClick={onBack}
        className={`self-start mb-8 px-6 py-3 border-b-4 rounded-xl text-xl font-bold shadow-sm flex items-center gap-3 transition-all active:translate-y-1 active:border-b-0 ${backBtnBg}`}
        aria-label={getTranslation(lang, 'goBack')}
      >
        <span className="text-2xl">↩️</span>
        <span>{getTranslation(lang, 'goBack')}</span>
      </button>

      <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col relative">
        {/* Title */}
        <h2 className={`text-4xl lg:text-5xl font-black mb-8 leading-tight drop-shadow-sm font-['Merriweather',_serif] ${isEyeCare ? 'text-indigo-300' : 'text-indigo-900'}`}>
          {control.label}
        </h2>
        
        {/* Main Instruction Card */}
        <div className={`w-full relative p-10 lg:p-16 rounded-[2px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] mb-10 flex-grow-0 transform rotate-1 ${bgCard}`}>
          
          {/* Paper Texture */}
          {!isEyeCare && (
             <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none"></div>
          )}

          {/* Scotch Tape Visuals */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-white/30 backdrop-blur-sm border-l border-r border-white/40 transform -rotate-1 shadow-sm opacity-80"></div>
          <div className="absolute -bottom-4 left-10 w-32 h-10 bg-white/30 backdrop-blur-sm border-l border-r border-white/40 transform rotate-2 shadow-sm opacity-80"></div>

          <p className={`relative text-4xl lg:text-5xl font-bold leading-relaxed font-['Merriweather',_serif] ${textColorPrimary}`}>
            {control.detailText}
          </p>
        </div>

        <div className="mt-auto space-y-8">
          {/* Action Button - Speaker Mesh Style */}
          <button
            onClick={speak}
            className="w-full py-8 bg-indigo-600 rounded-2xl border-b-[8px] border-indigo-900 text-2xl lg:text-3xl font-bold text-white shadow-2xl active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-6 hover:bg-indigo-500 relative overflow-hidden group"
          >
             {/* Mesh Texture Overlay */}
             <div className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{
                    backgroundImage: 'radial-gradient(black 15%, transparent 16%)',
                    backgroundSize: '4px 4px'
                  }}>
             </div>
             
             {/* Radial Shine */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none"></div>

            <span className="text-4xl filter drop-shadow-lg group-active:scale-95 transition-transform">🔊</span>
            <span className="filter drop-shadow-md">{getTranslation(lang, 'listenAgain')}</span>
          </button>
          
          {/* Context Helper */}
          <div className={`text-center p-4 rounded-xl border-2 border-dashed ${isEyeCare ? 'border-stone-700' : 'border-stone-300'}`}>
             <p className={`text-xl font-medium ${textColorSecondary}`}>
               <span className="uppercase text-sm tracking-widest block mb-1 opacity-70">{getTranslation(lang, 'located')}</span>
               {control.description}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};