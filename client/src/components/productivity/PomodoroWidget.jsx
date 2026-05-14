import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from '../shared/Tooltip';

export const PomodoroWidget = () => {
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('Focus'); // 'Focus' or 'Break'

  const notify = useCallback((message) => {
    if (Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Pomodoro Timer', { body: message });
        }
      });
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      const nextMode = mode === 'Focus' ? 'Break' : 'Focus';
      const nextTime = nextMode === 'Focus' ? FOCUS_TIME : BREAK_TIME;
      
      notify(`${mode} session complete! Time for a ${nextMode.toLowerCase()}.`);
      
      setMode(nextMode);
      setTimeLeft(nextTime);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, notify]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('Focus');
    setTimeLeft(FOCUS_TIME);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-2 left-5 z-40 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-[240px] h-[44px] px-3 rounded-[12px] border border-white/5 shadow-xl pointer-events-auto flex items-center justify-between"
        style={{ 
          background: 'rgba(20, 25, 40, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* LEFT: Icon + Mode */}
        <div className="flex items-center gap-2 min-w-[70px]">
          <span className="text-sm">🍅</span>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${mode === 'Focus' ? 'text-primary' : 'text-success'} opacity-60`}>
            {mode}
          </span>
        </div>

        {/* CENTER: Time */}
        <div className="text-lg font-semibold text-white font-mono tabular-nums">
          {formatTime(timeLeft)}
        </div>

        {/* RIGHT: Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTimer}
            className={`h-7 px-3 rounded-lg font-bold text-[12px] transition-all ${
              isActive 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'
            }`}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <Tooltip text="Reset">
            <button
              onClick={resetTimer}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-all text-[12px]"
            >
              ↺
            </button>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  );
};
