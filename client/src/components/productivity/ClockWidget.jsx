import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const ClockWidget = () => {
  const [time, setTime] = useState(new Date());
  const [isHovered, setIsHovered] = useState(false);
  const { sessionActive, sessionTime, isLoading, error, clockIn, clockOut } = useSession();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatSessionTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSessionToggle = async () => {
    if (sessionActive) {
      await clockOut();
    } else {
      await clockIn();
    }
  };

  return (
    <div className="absolute bottom-[145px] left-5 z-40 pointer-events-none">
      {/* Ambient Presence Glow */}
      {sessionActive && (
        <div 
          className="absolute inset-0 rounded-[16px] opacity-20 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at center, rgb(34 211 238) 0%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
      )}

      <div 
        className={`relative w-[150px] transition-all duration-300 ease-in-out ${
          sessionActive ? 'h-[75px]' : 'h-[50px]'
        } px-4 py-3 rounded-[16px] border shadow-xl pointer-events-auto flex flex-col justify-center cursor-pointer group/widget overflow-hidden`}
        style={{ 
          background: isHovered ? 'rgba(25, 30, 45, 0.85)' : 'rgba(15, 20, 30, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: isHovered 
            ? (sessionActive ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.15)')
            : (sessionActive ? 'rgba(34, 211, 238, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
          boxShadow: isHovered 
            ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.03)' 
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSessionToggle}
      >
        {/* Shimmer Effect on Hover */}
        <div className={`absolute inset-0 opacity-0 group-hover/widget:opacity-100 transition-opacity duration-700 pointer-events-none`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover/widget:translate-x-full transition-transform duration-1000 ease-in-out" />
        </div>

        <div className={`flex flex-col relative z-10 transition-all duration-500 ${!sessionActive ? 'items-center justify-center h-full' : 'gap-0.5'}`}>
          {/* Current Time Display */}
          <div className={`flex items-center w-full transition-all duration-500 ${sessionActive ? 'justify-between' : 'justify-center'}`}>
            <span className={`font-light tracking-tight text-white/95 flex items-baseline transition-all duration-500 ${sessionActive ? 'text-lg' : 'text-xl'}`}>
              {formatTime(time).replace(/ (AM|PM)/i, '')}
              <span className="text-[8px] ml-1 opacity-30 font-bold uppercase tracking-wider">{formatTime(time).slice(-2)}</span>
            </span>
            
            {sessionActive && (
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-1 h-1 rounded-full bg-cyan-400"
                  style={{
                    boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              </div>
            )}
          </div>
          
          {sessionActive && (
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-[0.2em] text-white/20 font-bold leading-tight">
                Presence Active
              </span>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-cyan-400/70 font-medium">
                  {formatSessionTime(sessionTime)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading/Error Overlays */}
        {(isLoading || error) && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-black/40 z-50">
            {isLoading ? (
              <div className="w-4 h-4 border border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            ) : (
              <span className="text-[8px] text-red-400/80 text-center font-bold tracking-tight uppercase px-4">{error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
