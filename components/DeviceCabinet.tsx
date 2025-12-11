
import React from 'react';
import { DeviceAnalysis, Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  devices: DeviceAnalysis[];
  onSelect: (device: DeviceAnalysis) => void;
  onDelete: (id: string) => void;
  lang: Language;
  theme: Theme;
}

export const DeviceCabinet: React.FC<Props> = ({ devices, onSelect, onDelete, lang, theme }) => {
  const isEyeCare = theme === 'eye-care';
  
  // Cabinet Styles
  const shelfColor = isEyeCare ? 'bg-stone-800 border-stone-700' : 'bg-[#d4c4a8] border-[#b0a080]';
  const shelfShadow = isEyeCare ? 'shadow-black' : 'shadow-xl';
  const textColor = isEyeCare ? 'text-stone-300' : 'text-stone-700';
  const cardBg = isEyeCare ? 'bg-stone-700' : 'bg-white';

  if (devices.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8 px-4 animate-slide-up-fade">
      <div className="flex items-center gap-3 mb-4 pl-2">
        <span className="text-3xl">🗄️</span>
        <h2 className={`text-2xl font-bold font-serif ${isEyeCare ? 'text-yellow-100' : 'text-stone-800'}`}>
           {getTranslation(lang, 'myCabinet')}
        </h2>
      </div>

      {/* The Physical Shelf */}
      <div className={`
        relative rounded-lg p-6 pb-8 border-b-[16px] border-r-[4px] 
        ${shelfColor} ${shelfShadow}
      `}>
         {/* Wood Texture CSS */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.1) 50%)', backgroundSize: '40px 100%'}}>
         </div>

         {/* Items on Shelf */}
         <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className={`
                   relative flex-shrink-0 w-64 snap-start group
                   rounded-t-lg rounded-b-sm p-3 flex flex-col gap-3
                   shadow-[5px_5px_10px_rgba(0,0,0,0.2)] 
                   transition-all hover:-translate-y-2 hover:shadow-2xl
                   cursor-pointer border-t border-white/20
                   ${cardBg}
                `}
                onClick={() => onSelect(device)}
              >
                 {/* Folder Tab Visual */}
                 <div className={`absolute -top-3 left-0 w-24 h-4 rounded-t-md ${cardBg}`}></div>

                 {/* Thumbnail */}
                 <div className="w-full h-32 bg-black rounded-md overflow-hidden relative border-2 border-opacity-10 border-black">
                    {device.originalImage ? (
                      <img src={device.originalImage} alt={device.deviceName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
                    )}
                    {/* Gloss */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 pointer-events-none"></div>
                 </div>

                 {/* Label */}
                 <div className="flex-1">
                    <h3 className={`font-bold text-lg leading-tight line-clamp-2 ${isEyeCare ? 'text-white' : 'text-stone-800'}`}>
                      {device.deviceName}
                    </h3>
                    <p className={`text-xs mt-1 ${isEyeCare ? 'text-stone-400' : 'text-stone-500'}`}>
                       {new Date(device.timestamp || 0).toLocaleDateString()}
                    </p>
                 </div>

                 {/* Actions */}
                 <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/10">
                    <span className={`text-sm font-bold uppercase tracking-wider ${isEyeCare ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      {getTranslation(lang, 'open')}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(device.id) onDelete(device.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500 transition-colors"
                      title={getTranslation(lang, 'delete')}
                    >
                      🗑️
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
