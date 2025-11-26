import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
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
    className={`transition-all duration-1000 ${isSleeping ? 'text-blue-400' : 'text-primary-600'}`}
  >
    <path d="M2 10h20" className="opacity-50" /> 
    <path d="M7 10c0-3 2-5 5-5s5 2 5 5" />
    <path d="M7 10v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" />
    <path d="M7 10v-2" />
    <path d="M17 10v-2" />
    {isSleeping ? (
       <>
         <path d="M11 8l1 1" />
         <path d="M11 9l1 -1" />
         <path d="M13 8l1 1" />
         <path d="M13 9l1 -1" />
         <path d="M15 6l2 -2" className="animate-pulse" />
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

interface FocusTimerProps {
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ 
  soundEnabled = true, 
  notificationsEnabled = false 
}) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const playSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  useEffect(() => {
    let interval: number;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playSound();
      setIsActive(false);
      if (mode === 'focus') {
        sendNotification("Foco concluído!", "Hora do descanso!");
        setMode('break');
        setTimeLeft(BREAK_TIME);
      } else {
        sendNotification("Descanso acabou!", "Hora de focar!");
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    if (!audioContextRef.current && soundEnabled) {
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setIsActive(!isActive);
  };

  const skipTimer = () => {
    setIsActive(false);
    if (mode === 'focus') {
        setMode('break');
        setTimeLeft(BREAK_TIME);
    } else {
        setMode('focus');
        setTimeLeft(FOCUS_TIME);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maxTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progress = ((maxTime - timeLeft) / maxTime) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 py-6">
      {/* Unified Circle Timer */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Background Track */}
        <div className="absolute inset-0 rounded-full border-8 border-slate-100"></div>
        
        {/* Progress Arc (SVG) */}
        <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none">
          <circle
            cx="144"
            cy="144"
            r="132" /* 144 - border width/2 approx */
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 132}
            strokeDashoffset={2 * Math.PI * 132 * (1 - progress / 100)}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${
              mode === 'focus' ? 'text-primary-500' : 'text-blue-400'
            }`}
          />
        </svg>

        <div className="flex flex-col items-center z-10">
          <div className="mb-2 transform scale-110">
            <SlothFocus size={80} isSleeping={mode === 'break'} />
          </div>
          <span className="text-6xl font-bold text-slate-800 tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <p className={`text-sm font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full ${mode === 'focus' ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
            {mode === 'focus' ? 'Modo Foco' : 'Pausa Relax'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <Button 
          onClick={resetTimer}
          variant="ghost"
          className="text-slate-400 hover:text-slate-600"
          title="Reiniciar"
        >
          <RotateCcw size={24} />
        </Button>

        <Button 
          onClick={toggleTimer} 
          className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all transform hover:scale-105 shadow-xl ${
            isActive 
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 border-2 border-amber-200' 
              : mode === 'focus' 
                 ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/30'
                 : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/30'
          }`}
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </Button>
        
        <Button 
          onClick={skipTimer}
          variant="ghost"
          className="text-slate-400 hover:text-slate-600"
          title="Pular etapa"
        >
          <SkipForward size={24} />
        </Button>
      </div>

      <p className="text-xs text-slate-400 max-w-xs text-center h-4">
         {isActive && (mode === 'focus' ? "Mantenha o foco..." : "Aproveite para descansar...")}
      </p>
    </div>
  );
};
