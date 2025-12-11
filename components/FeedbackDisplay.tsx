import React, { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  lastActionDescription: string | null;
}

export const FeedbackDisplay: React.FC<Props> = ({ message, lastActionDescription }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-6 bg-blue-900 border-t-4 border-white z-50 shadow-2xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-bold text-white mb-2">✅ Action Sent</h3>
        <p className="text-2xl text-yellow-300 font-bold mb-2">"{message}"</p>
        {lastActionDescription && (
          <p className="text-white text-lg opacity-90">
            Physical context: {lastActionDescription}
          </p>
        )}
      </div>
    </div>
  );
};