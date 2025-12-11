import React from 'react';
import { DeviceAnalysis, ControlCategory, DeviceControl, Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  analysis: DeviceAnalysis;
  imageSrc: string | null;
  onControlClick: (control: DeviceControl) => void;
  onOpenChat: () => void;
  lang: Language;
  theme: Theme;
}

// Internal Mascot Component
const AiMascot = ({ onMascotClick, lang, theme }: { onMascotClick: () => void, lang: Language, theme: Theme }) => {
  const isEyeCare = theme === 'eye-care';
  
  return (
    <button 
      onClick={onMascotClick}
      className="mt-8 flex flex-col items-center group focus:outline-none w-full"
      aria-label={getTranslation(lang, 'tapForHelp')}
    >
      <div className="relative w-28 h-28 transform transition-transform duration-300 group-hover:-translate-y-2">
        {/* Body */}
        <div className={`absolute inset-0 rounded-[2rem] shadow-xl flex flex-col items-center justify-center animate-float border-[3px] ring-4 ${isEyeCare ? 'bg-indigo-900 border-stone-600 ring-stone-700' : 'bg-indigo-500 border-indigo-200 ring-indigo-50'}`}>
          
          {/* Antenna */}
          <div className={`absolute -top-5 w-1.5 h-6 rounded-full ${isEyeCare ? 'bg-indigo-700' : 'bg-indigo-400'}`}>
              <div className="absolute -top-2 -left-1.5 w-4 h-4 bg-rose-400 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
          </div>

          {/* Face Screen */}
          <div className="w-20 h-12 bg-indigo-950 rounded-xl flex items-center justify-center gap-3 relative overflow-hidden shadow-inner">
             {/* Eyes */}
             <div className="w-3 h-4 bg-cyan-200 rounded-full animate-blink shadow-[0_0_8px_rgba(103,232,249,0.8)]"></div>
             <div className="w-3 h-4 bg-cyan-200 rounded-full animate-blink shadow-[0_0_8px_rgba(103,232,249,0.8)]"></div>
             {/* Mouth (Smile) */}
             <div className="absolute bottom-2 w-4 h-1.5 border-b-2 border-cyan-200 rounded-full opacity-60"></div>
          </div>
        </div>
        
        {/* Shadow */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/10 rounded-full blur-sm animate-shadow-pulse"></div>
      </div>

      {/* Bubble */}
      <div className={`mt-5 py-2 px-5 rounded-full shadow-sm border text-sm font-bold tracking-wide transform transition-all duration-300 group-hover:scale-105 ${isEyeCare ? 'bg-stone-800 border-stone-600 text-yellow-100' : 'bg-white border-indigo-100 text-indigo-800'}`}>
        {getTranslation(lang, 'tapForHelp')}
      </div>
    </button>
  );
};

export const PriorityPanel: React.FC<Props> = ({ analysis, imageSrc, onControlClick, onOpenChat, lang, theme }) => {
  const safetyWarning = analysis.safetyWarning;
  const isEyeCare = theme === 'eye-care';

  // Notebook Page Style
  const pageBg = isEyeCare ? 'bg-stone-900' : 'bg-[#fffef0]'; // Creamy yellow paper
  const holeColor = isEyeCare ? 'bg-stone-800' : 'bg-white';
  const textColorPrimary = isEyeCare ? 'text-yellow-100' : 'text-stone-800';
  
  // Get primary actions (Max 3)
  const quickActions = analysis.controls
    .filter(c => c.category === ControlCategory.PRIMARY)
    .slice(0, 3);

  return (
    <div className="w-full relative pl-6">
      {/* 3D Spiral Binding */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-evenly py-6 z-20">
         {[...Array(12)].map((_, i) => (
           <div key={i} className="relative w-full h-8 flex items-center">
             {/* The Hole */}
             <div className={`absolute left-4 w-4 h-4 rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)] ${holeColor}`}></div>
             {/* The Metal Ring (Front) */}
             <div className="absolute left-0 w-8 h-4 border-t-[6px] border-l-[4px] border-gray-400 rounded-l-full rounded-tr-full transform -rotate-12 shadow-sm z-10"></div>
             {/* The Metal Ring (Back part hidden) */}
           </div>
         ))}
      </div>

      <div className={`relative rounded-tr-[1rem] rounded-br-[1rem] shadow-[5px_5px_15px_rgba(0,0,0,0.15)] overflow-hidden min-h-[500px] ${pageBg}`}>
        
        {/* Page Edge Curvature Shadow (Left) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10"></div>

        {/* Ruled Lines Background */}
        <div className={`absolute inset-0 pointer-events-none opacity-80`} 
             style={{
               backgroundImage: `linear-gradient(${isEyeCare ? '#292524' : '#e0f2fe'} 1px, transparent 1px)`,
               backgroundSize: '100% 2.5rem',
               marginTop: '4rem'
             }}>
        </div>
        
        {/* Red Margin Line */}
        <div className={`absolute left-10 top-0 bottom-0 w-[2px] opacity-50 ${isEyeCare ? 'bg-red-900' : 'bg-red-300'}`}></div>

        <div className="relative p-8 pl-14">
          
          {/* Mini Polaroid of the Captured Device */}
          {imageSrc && (
            <div className="absolute -top-4 -right-2 w-32 rotate-6 z-20 transition-transform hover:scale-105 hover:rotate-3">
              {/* Paperclip */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-12 border-4 border-gray-300 rounded-full z-30 bg-transparent shadow-sm"></div>
              
              <div className="bg-white p-2 pb-8 shadow-md transform">
                <div className="bg-black w-full aspect-square overflow-hidden">
                  <img src={imageSrc} alt="Device" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-4">
            <h2 className={`font-['Kalam',_cursive] text-3xl font-bold tracking-wide ${textColorPrimary}`}>
              {getTranslation(lang, 'startHere')}
            </h2>
            {/* Stamp Effect */}
            <div className={`
              border-4 border-double p-2 rounded transform -rotate-12 opacity-80
              ${safetyWarning 
                ? 'border-red-500 text-red-500' 
                : 'border-green-600 text-green-600'}
            `}>
              <span className="font-black uppercase tracking-widest text-xs">
                {safetyWarning ? 'ATTENTION' : 'VERIFIED'}
              </span>
            </div>
          </div>

          {/* Content Container */}
          <div className="space-y-8">
            
            {/* Summary */}
            <p className={`text-xl font-medium leading-loose font-['Kalam',_cursive] ${isEyeCare ? 'text-stone-300' : 'text-stone-700'}`}>
              {analysis.summary}
            </p>

            {/* Safety Warning (Sticker style) */}
            {safetyWarning && (
              <div className={`transform -rotate-1 rounded-xl p-4 shadow-sm border-2 flex gap-3 items-start ${isEyeCare ? 'bg-red-900/40 border-red-800' : 'bg-red-50 border-red-100'}`}>
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${isEyeCare ? 'text-red-300' : 'text-red-800'}`}>{getTranslation(lang, 'safetyFirst')}</h3>
                  <p className={`font-bold leading-tight ${isEyeCare ? 'text-red-200' : 'text-red-900'}`}>{safetyWarning}</p>
                </div>
              </div>
            )}

            {/* Steps List */}
            {quickActions.length > 0 && (
              <div className="space-y-4 pt-2">
                {quickActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => onControlClick(action)}
                    className={`w-full text-left flex items-center gap-4 p-3 pr-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-md group ${isEyeCare ? 'bg-stone-800 hover:bg-stone-700' : 'bg-white hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-100'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isEyeCare ? 'bg-stone-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                      {index + 1}
                    </div>
                    <span className={`text-lg font-bold flex-1 ${textColorPrimary}`}>
                      {action.label}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xl">➡️</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mascot at bottom of page */}
          <AiMascot onMascotClick={onOpenChat} lang={lang} theme={theme} />

        </div>
      </div>
    </div>
  );
};