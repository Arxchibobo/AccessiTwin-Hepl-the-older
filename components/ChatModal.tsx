import React, { useState, useEffect, useRef } from 'react';
import { DeviceAnalysis, ChatMessage, Language, Theme } from '../types';
import { chatWithDeviceExpert } from '../services/geminiService';
import { getTranslation } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: DeviceAnalysis;
  lang: Language;
  theme: Theme;
}

export const ChatModal: React.FC<Props> = ({ isOpen, onClose, analysis, lang, theme }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Theme styles
  const isEyeCare = theme === 'eye-care';
  
  // Tablet Device Styles
  const bezelColor = isEyeCare ? 'bg-stone-800' : 'bg-black';
  const screenBg = isEyeCare ? 'bg-stone-900' : 'bg-white';
  
  const bubbleUserBg = isEyeCare ? 'bg-indigo-900 text-white' : 'bg-blue-600 text-white';
  const bubbleAiBg = isEyeCare ? 'bg-stone-800 text-stone-200' : 'bg-gray-200 text-gray-800';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'model',
        text: lang === 'zh' ? `我是您的助手。关于 ${analysis.deviceName}，您想知道什么？` :
              lang === 'es' ? `Soy tu asistente. ¿Qué quieres saber sobre ${analysis.deviceName}?` :
              `I am your assistant. What would you like to know about the ${analysis.deviceName}?`
      }]);
    }
  }, [isOpen, analysis, lang, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const responseText = await chatWithDeviceExpert(messages, userText, analysis, lang);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(responseText);
      if (lang === 'zh') utterance.lang = 'zh-CN';
      if (lang === 'es') utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 bg-black/70 backdrop-blur-md animate-fade-in">
      
      {/* The Tablet Device */}
      <div className={`relative w-full max-w-3xl h-[85vh] rounded-[2.5rem] p-4 lg:p-6 shadow-[0_0_0_10px_#333,0_20px_50px_rgba(0,0,0,0.5)] flex flex-col ${bezelColor}`}>
        
        {/* Tablet Camera / Sensors */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 flex justify-center items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-gray-800 border border-gray-700"></div>
          <div className="w-3 h-3 rounded-full bg-[#111] border border-gray-700 relative">
             <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-blue-900 rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Screen Area */}
        <div className={`flex-1 rounded-[1.5rem] overflow-hidden flex flex-col relative border-2 border-gray-800 ${screenBg}`}>
          
          {/* Header Bar */}
          <div className={`p-4 flex justify-between items-center shadow-sm z-10 ${isEyeCare ? 'bg-stone-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                🤖
              </div>
              <div>
                <h3 className={`font-bold leading-none ${isEyeCare ? 'text-white' : 'text-black'}`}>Assistant</h3>
                <span className="text-xs text-green-500 font-bold tracking-wider">● ONLINE</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold transition-colors"
            >
              {getTranslation(lang, 'close')}
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[85%] px-5 py-3 rounded-2xl text-lg lg:text-xl font-medium shadow-sm
                    ${msg.role === 'user' ? `${bubbleUserBg} rounded-br-sm` : `${bubbleAiBg} rounded-bl-sm`}
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`px-5 py-4 rounded-2xl rounded-bl-sm ${bubbleAiBg} flex gap-2`}>
                   <span className="animate-bounce">●</span>
                   <span className="animate-bounce delay-100">●</span>
                   <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 ${isEyeCare ? 'bg-stone-800' : 'bg-gray-100'}`}>
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={getTranslation(lang, 'askMe')}
                className={`flex-1 h-14 pl-6 pr-4 rounded-xl text-lg focus:outline-none ring-2 ring-transparent focus:ring-indigo-500 transition-shadow ${isEyeCare ? 'bg-stone-700 text-white placeholder-stone-500' : 'bg-white text-black placeholder-gray-400 shadow-sm'}`}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-14 w-16 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center text-white text-2xl shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                ➤
              </button>
            </div>
          </div>

        </div>

        {/* Home Button */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-10 flex justify-center items-center">
            <button onClick={onClose} className="w-12 h-1.5 bg-gray-800 rounded-full"></button>
        </div>

      </div>
    </div>
  );
};