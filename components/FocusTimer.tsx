
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from './Button';

const SlothFocus = ({ size = 120, isSleeping = false }: { size?: number, isSleeping?: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`transition-all duration-1000 ${isSleeping ? 'text-primary-400' : 'text-primary-600'}`}
  >
    <path d="M2 10h20" className="opacity-50" /> {/* Galho mais baixo para ele deitar */}
    {/* Corpo deitado */}
    <path d="M7 10c0-3 2-5 5-5s5 2 5 5" />
    <path d="M7 10v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    {/* Braços segurando */}
    <path d="M7 10v-2" />
    <path d="M17 10v-2" />
    {/* Rosto */}
    {isSleeping ? (
       <>
         <path d="M11 8l1 1" />
         <path d="M11 9l1 -1" />
         <path d="M13 8l1 1" />
         <path d="M13 9l1 -1" />
         <path d="M15 6l2 -2" className="animate-pulse" /> {/* Zzz */}
       </>
    ) : (
       <>
         <circle cx="11" cy="8" r="1" fill="currentColor" />
         <circle cx="13" cy="8" r="1" fill="currentColor" />
         <path d="M11 11s.5 .5 1 .5 1-.5 1-.5" />
       </>
    )}
  </svg>
);

export const FocusTimer: React.FC = () => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound notification here if needed
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100 
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 py-6">
      
      {/* Mode Selector */}
      <div className="bg-slate-100 p-1 rounded-xl flex">
        <button
          onClick={() => switchMode('focus')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            mode === 'focus' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Brain size={16} /> Foco
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            mode === 'break' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Coffee size={16} /> Pausa
        </button>
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`transition-all duration-1000 ease-linear ${
              mode === 'focus' ? 'text-primary-500' : 'text-blue-400'
            }`}
          />
        </svg>

        <div className="flex flex-col items-center z-10">
          <div className="mb-2">
            <SlothFocus size={64} isSleeping={mode === 'break'} />
          </div>
          <span className="text-5xl font-bold text-slate-800 tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-2">
            {isActive ? (mode === 'focus' ? 'Focando...' : 'Descansando...') : 'Pausado'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button 
          onClick={toggleTimer} 
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all transform hover:scale-105 ${
            isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30'
          }`}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </Button>
        
        <Button 
          onClick={resetTimer}
          variant="secondary"
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <RotateCcw size={24} />
        </Button>
      </div>

      <div className="text-center max-w-xs mx-auto">
        <p className="text-xs text-slate-400">
           {mode === 'focus' 
             ? "O segredo não é correr, é não parar. Respire fundo e faça uma coisa de cada vez."
             : "Hora de relaxar. Estique os braços, olhe pela janela e seja um pouco preguiça."}
        </p>
      </div>

    </div>
  );
};
