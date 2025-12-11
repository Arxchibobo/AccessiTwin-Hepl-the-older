import React, { useState } from 'react';
import { Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
  lang: Language;
  theme: Theme;
}

export const ImageUploader: React.FC<Props> = ({ onImageSelected, isLoading, lang, theme }) => {
  const isEyeCare = theme === 'eye-care';
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Theme logic
  const cardBg = isEyeCare ? 'bg-stone-800' : 'bg-white';
  const textColor = isEyeCare ? 'text-yellow-100' : 'text-slate-800';
  const handWrittenColor = isEyeCare ? 'text-yellow-200' : 'text-indigo-900';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Trigger flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200); // Quick flash
      
      // Delay actual processing slightly to let flash finish
      const file = e.target.files[0];
      setTimeout(() => onImageSelected(file), 300);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 w-full overflow-hidden relative z-10">
      
      {/* Flash Effect Layer */}
      <div className={`fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-300 ease-out ${isFlashing ? 'opacity-80' : 'opacity-0'}`}></div>

      {/* Intro Text */}
      <div className="mb-12 text-center max-w-lg z-10 relative">
        <div className="absolute -top-8 -left-8 text-6xl opacity-40 transform -rotate-12 animate-wiggle">👋</div>
        <h1 className={`text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight ${textColor} drop-shadow-sm`}>
          {getTranslation(lang, 'hello')}
        </h1>
        <p className={`text-xl lg:text-2xl font-medium leading-relaxed opacity-80 ${textColor}`}>
          {getTranslation(lang, 'intro')}
        </p>
      </div>

      {/* The Clean Polaroid */}
      <label 
        htmlFor="camera-input"
        className={`
          relative group cursor-pointer
          w-full max-w-[340px] aspect-[0.88] 
          flex flex-col p-4 pb-16
          ${cardBg} 
          transform rotate-2 hover:rotate-0 hover:scale-[1.02] hover:-translate-y-2
          transition-all duration-500 ease-out
          rounded-[4px]
        `}
        style={{
          boxShadow: isEyeCare 
            ? '0 20px 40px -10px rgba(0,0,0,0.8)' 
            : '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)'
        }}
      >
        {/* Glossy Reflection (Gradient) - very subtle now */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/40 pointer-events-none rounded-[4px]"></div>

        {/* Viewfinder / Lens Area */}
        <div className={`
          flex-1 w-full relative overflow-hidden rounded-sm
          ${isEyeCare ? 'bg-stone-900' : 'bg-indigo-50/50'}
          flex flex-col items-center justify-center
          transition-colors duration-1000
          shadow-inner
          border-2 border-transparent
          ${!isEyeCare && 'border-indigo-50'}
        `}>
          
          {isLoading ? (
            // SCANNING ANIMATION (Clean Light Version)
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
               {/* Grid Background */}
               <div className="absolute inset-0 opacity-20" 
                    style={{ 
                      backgroundImage: isEyeCare 
                        ? 'linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)'
                        : 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', 
                      backgroundSize: '24px 24px' 
                    }}>
               </div>
               
               {/* Scanning Line - Blue/Indigo */}
               <div className="absolute w-full h-[3px] bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-[scan_2s_linear_infinite]"></div>

               {/* Center Text */}
               <div className={`z-10 px-6 py-2 rounded-full border backdrop-blur-md shadow-sm ${isEyeCare ? 'bg-stone-800/90 border-stone-600 text-yellow-100' : 'bg-white/80 border-indigo-100 text-indigo-600'}`}>
                 <span className="font-bold tracking-widest text-sm uppercase animate-pulse">
                   {getTranslation(lang, 'analyzing')}
                 </span>
               </div>
            </div>
          ) : (
            // Idle State - Friendly Camera Icon
            <div className="transform transition-transform duration-500 group-hover:scale-110">
               {/* CSS Constructed Friendly Camera */}
               <div className={`
                 relative w-32 h-24 rounded-[20px] shadow-lg flex items-center justify-center
                 ${isEyeCare 
                   ? 'bg-indigo-800 border-4 border-stone-600' 
                   : 'bg-gradient-to-br from-indigo-400 to-indigo-500 shadow-indigo-200'}
               `}>
                  {/* Top Flash Bump */}
                  <div className={`absolute -top-2 left-6 w-12 h-4 rounded-t-lg ${isEyeCare ? 'bg-indigo-700' : 'bg-indigo-400'}`}></div>
                  
                  {/* Lens Ring */}
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-[3px] border-white/40 flex items-center justify-center shadow-sm">
                     {/* Lens Glass */}
                     <div className="w-12 h-12 rounded-full bg-indigo-900 overflow-hidden relative shadow-inner flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-800 opacity-80"></div>
                        {/* Reflection */}
                        <div className="absolute top-2 right-3 w-2 h-2 bg-white/60 rounded-full"></div>
                     </div>
                  </div>

                  {/* Red Recording Dot */}
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-400 rounded-full shadow-sm animate-pulse"></div>
               </div>
               
               <div className={`mt-4 text-center font-bold tracking-widest text-xs uppercase opacity-60 ${isEyeCare ? 'text-stone-500' : 'text-indigo-300'}`}>
                 Tap to start
               </div>
            </div>
          )}
        </div>

        {/* Handwritten Label Area */}
        <div className="absolute bottom-3 left-0 right-0 text-center px-4">
          <p className={`font-['Kalam',_cursive] text-3xl font-bold transform -rotate-1 ${handWrittenColor} opacity-90`}>
            {getTranslation(lang, 'takePhoto')} 🖊️
          </p>
        </div>

        {/* File Input */}
        <input 
          id="camera-input"
          type="file" 
          accept="image/*" 
          capture="environment"
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />
      </label>

      {/* Decorative Stack Effect (Cards underneath) - Clean Colors */}
      <div className={`
        absolute z-[-1] w-[320px] h-[360px] 
        ${isEyeCare ? 'bg-stone-700' : 'bg-slate-100'}
        rounded shadow-sm transform -rotate-6 translate-y-2
      `}></div>
      <div className={`
        absolute z-[-2] w-[320px] h-[360px] 
        ${isEyeCare ? 'bg-stone-600' : 'bg-slate-200'}
        rounded shadow-sm transform rotate-3 translate-y-4 translate-x-4
      `}></div>

      {/* Styles for scanning animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
