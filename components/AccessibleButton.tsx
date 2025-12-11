import React from 'react';
import { DeviceControl, ControlCategory, Theme } from '../types';

interface Props {
  control: DeviceControl;
  onClick: (control: DeviceControl) => void;
  theme: Theme;
}

export const AccessibleButton: React.FC<Props> = ({ control, onClick, theme }) => {
  const isEyeCare = theme === 'eye-care';

  // Styles based on category - High Contrast & Tactile
  let styles = "";
  let icon = "";
  let textPrimary = "";
  let textSecondary = "";

  if (isEyeCare) {
    // Dark / Eye Care Theme - High Contrast Yellows/Whites on Dark
    switch (control.category) {
      case ControlCategory.PRIMARY:
        styles = "bg-indigo-950 border-indigo-400 hover:bg-indigo-900";
        textPrimary = "text-white";
        textSecondary = "text-indigo-200";
        icon = "🔷";
        break;
      case ControlCategory.DANGER:
        styles = "bg-red-950 border-red-400 hover:bg-red-900";
        textPrimary = "text-red-50";
        textSecondary = "text-red-200";
        icon = "⚠️"; 
        break;
      default:
        styles = "bg-stone-800 border-stone-500 hover:bg-stone-700";
        textPrimary = "text-stone-50";
        textSecondary = "text-stone-300";
        icon = "⚪";
        break;
    }
  } else {
    // Light / Bright Theme - Clear black text, distinct thick borders
    switch (control.category) {
      case ControlCategory.PRIMARY:
        styles = "bg-indigo-50 border-indigo-600 hover:bg-indigo-100 hover:border-indigo-800 ring-2 ring-indigo-200";
        textPrimary = "text-indigo-950";
        textSecondary = "text-indigo-800";
        icon = "🔷";
        break;
      case ControlCategory.DANGER:
        styles = "bg-red-50 border-red-600 hover:bg-red-100 hover:border-red-800 ring-2 ring-red-200";
        textPrimary = "text-red-950";
        textSecondary = "text-red-800";
        icon = "⚠️"; 
        break;
      default:
        styles = "bg-white border-stone-500 hover:bg-stone-100 hover:border-stone-700 ring-2 ring-stone-200";
        textPrimary = "text-black";
        textSecondary = "text-stone-700";
        icon = "⚪";
        break;
    }
  }

  const handleClick = () => {
    // Nuanced Haptic Feedback based on Category
    if (navigator.vibrate) {
      try {
        switch (control.category) {
          case ControlCategory.DANGER:
            // Strong Warning: Double heavy pulse (Buzz-pause-Buzz)
            navigator.vibrate([70, 50, 70]); 
            break;
          case ControlCategory.PRIMARY:
            // Affirmative Action: Crisp, solid click (30ms)
            navigator.vibrate(30); 
            break;
          case ControlCategory.SECONDARY:
            // Minor Action: Light tick (10ms)
            navigator.vibrate(10); 
            break;
          case ControlCategory.ADVANCED:
          default:
            // Standard Feedback
            navigator.vibrate(15);
            break;
        }
      } catch (e) {
        // Fallback for older browsers or simple implementations
        navigator.vibrate(20);
      }
    }
    
    onClick(control);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full p-6 lg:p-8 rounded-[1.5rem] 
        border-2 border-b-[6px] transition-all active:border-b-2 active:translate-y-[4px]
        flex flex-row items-center justify-between text-left 
        shadow-md hover:shadow-lg
        ${styles}
      `}
      aria-label={`${control.label}. ${control.description}. Click for details.`}
    >
      <div className="flex flex-col gap-2 pr-4">
        <span className={`text-2xl lg:text-3xl font-black tracking-tight leading-none ${textPrimary}`}>
          {control.label}
        </span>
        <span className={`text-xl lg:text-2xl font-bold leading-tight ${textSecondary}`}>
          {control.description}
        </span>
      </div>
      
      <div className="text-4xl lg:text-5xl opacity-100 filter drop-shadow-sm" aria-hidden="true">
        {icon}
      </div>
    </button>
  );
};