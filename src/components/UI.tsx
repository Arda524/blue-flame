import React, { useState, useEffect } from 'react';

const UI: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentColor, setCurrentColor] = useState('Ethereal Blue');

  const colorModes = [
    'Ethereal Blue',
    'Mystical Purple', 
    'Celestial Cyan',
    'Phoenix Orange',
    'Emerald Green'
  ];

  useEffect(() => {
    const handleClick = () => {
      setCurrentColor(prev => {
        const currentIndex = colorModes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % colorModes.length;
        return colorModes[nextIndex];
      });
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Instructions */}
      <div 
        className={`absolute top-8 left-8 transition-opacity duration-1000 ${
          showInstructions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-white/80 text-sm max-w-xs">
          <h3 className="font-semibold mb-2 text-white">✨ Ethereal Fire</h3>
          <p className="mb-1">• Move your cursor to guide the fire</p>
          <p className="mb-1">• Click anywhere to change colors</p>
          <p>• Watch the magical trail follow you</p>
        </div>
      </div>

      {/* Color indicator */}
      <div className="absolute top-8 right-8">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white/90 text-sm font-medium">
          {currentColor}
        </div>
      </div>

      {/* Subtle branding */}
      <div className="absolute bottom-8 left-8">
        <div className="text-white/40 text-xs font-light">
          Ethereal Fire Experience
        </div>
      </div>
    </div>
  );
};

export default UI;