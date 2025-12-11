import React, { useState } from 'react';
import { Language, Theme } from '../types';
import { getTranslation } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme: Theme;
}

export const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, lang, theme }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isEyeCare = theme === 'eye-care';

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setRating(0);
        setComment('');
        onClose();
      }, 1500);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      
      {/* The Envelope */}
      <div className={`
        relative w-full max-w-lg p-8 
        transform transition-all duration-500
        ${isEyeCare ? 'bg-stone-800 border-2 border-stone-600' : 'bg-[#e3dac9]'}
        shadow-[0_20px_60px_rgba(0,0,0,0.3)]
        rotate-1
      `}>
        
        {/* Paper Texture */}
        {!isEyeCare && (
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] pointer-events-none mix-blend-multiply"></div>
        )}

        {/* Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 text-white rounded-full font-bold shadow-md hover:scale-110 transition-transform flex items-center justify-center z-10"
        >
          ✕
        </button>

        {isSuccess ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="text-8xl mb-4 animate-bounce">📬</div>
            <h3 className={`text-3xl font-black font-serif ${isEyeCare ? 'text-yellow-100' : 'text-stone-800'}`}>
              {getTranslation(lang, 'thankYou')}
            </h3>
            <p className="opacity-60 mt-2 font-serif italic">Sent via AccessiMail</p>
          </div>
        ) : (
          <div className="relative">
            {/* Header Stamp Style */}
            <div className="flex justify-between items-start mb-6 border-b-2 border-dotted border-black/10 pb-4">
              <h2 className={`text-3xl font-serif font-bold ${isEyeCare ? 'text-yellow-100' : 'text-stone-800 opacity-80'}`}>
                {getTranslation(lang, 'feedbackTitle')}
              </h2>
              {/* Fake Stamp */}
              <div className={`w-16 h-20 border-4 border-double p-1 flex items-center justify-center transform rotate-6 shadow-sm ${isEyeCare ? 'border-yellow-700 bg-stone-900' : 'border-red-800/30 bg-red-50'}`}>
                 <span className="text-2xl opacity-50">⭐</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className={`text-lg font-bold mb-3 ${isEyeCare ? 'text-stone-300' : 'text-stone-600'}`}>{getTranslation(lang, 'rateExperience')}</p>
                <div className="flex justify-center gap-2 bg-black/5 rounded-full p-2 inline-flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-transform hover:scale-125 hover:-rotate-12 ${rating >= star ? 'opacity-100' : 'opacity-20 grayscale'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={getTranslation(lang, 'feedbackPlaceholder')}
                  className={`w-full h-32 p-4 text-xl resize-none outline-none border-2 focus:border-indigo-400 font-serif leading-relaxed ${isEyeCare ? 'bg-stone-900 text-yellow-100 border-stone-600' : 'bg-white/50 text-stone-800 border-stone-300'}`}
                  style={{backgroundImage: isEyeCare ? 'none' : 'linear-gradient(transparent 1.9rem, #ccc 1.9rem)', backgroundSize: '100% 2rem', lineHeight: '2rem'}}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className={`w-full py-4 font-bold uppercase tracking-widest text-white shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 border-dashed border-2 border-white/20 ${isEyeCare ? 'bg-indigo-800' : 'bg-[#c2410c]'}`} // Rust color for stamp look
                style={{
                  maskImage: 'radial-gradient(circle at 4px 4px, transparent 4px, black 4.5px)',
                  maskPosition: '-4px -4px',
                  maskSize: '16px 16px',
                  maskComposite: 'exclude',
                  WebkitMaskImage: 'radial-gradient(circle at 4px 4px, transparent 4px, black 4.5px)',
                  WebkitMaskPosition: '-4px -4px',
                  WebkitMaskSize: '16px 16px',
                }}
              >
                {isSubmitting ? '...' : getTranslation(lang, 'submit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};