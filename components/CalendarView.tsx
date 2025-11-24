import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';

// Reusing Sloth Icon locally for this component to ensure self-containment or could export from a common file
const SlothIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 6h20" className="opacity-70" />
    <path d="M7 6v4a3 3 0 0 0 3 3" />
    <path d="M17 6v4a3 3 0 0 1-3 3" />
    <path d="M10 13h4" />
    <path d="M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
    <path d="M10 16h.01" />
    <path d="M14 16h.01" />
    <path d="M11 18c.5.5 1.5.5 2 0" />
  </svg>
);

interface CalendarViewProps {
  tasks: Task[];
  onAddTask?: (title: string, date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  // Helper to check if two dates are the same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Get tasks completed on specific dates
  const completedTasksMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.completed && (task.completedAt || task.createdAt)) {
        const date = new Date(task.completedAt || task.createdAt);
        const key = date.toDateString();
        const list = map.get(key) || [];
        list.push(task);
        map.set(key, list);
      }
    });
    return map;
  }, [tasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    const daysArray = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    // Add actual days
    for (let i = 1; i <= days; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };

  const days = getDaysInMonth(currentDate);
  
  const tasksForSelectedDay = completedTasksMap.get(selectedDay.toDateString()) || [];

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Calendar Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
            <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;
            
            const isSelected = isSameDay(date, selectedDay);
            const isToday = isSameDay(date, new Date());
            const hasTasks = completedTasksMap.has(date.toDateString());
            const taskCount = completedTasksMap.get(date.toDateString())?.length || 0;

            return (
              <button
                key={index}
                onClick={() => setSelectedDay(date)}
                className={`
                  relative h-10 w-10 md:h-12 md:w-12 mx-auto rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'bg-primary-600 text-white shadow-md scale-105' : 'text-slate-700 hover:bg-slate-50'}
                  ${isToday && !isSelected ? 'border border-primary-200 bg-primary-50 text-primary-700' : ''}
                `}
              >
                <span>{date.getDate()}</span>
                {hasTasks && !isSelected && (
                   <div className="absolute bottom-1.5 md:bottom-2 flex gap-0.5">
                      <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                      {taskCount > 1 && <div className="w-1 h-1 rounded-full bg-primary-500"></div>}
                      {taskCount > 2 && <div className="w-1 h-1 rounded-full bg-primary-500"></div>}
                   </div>
                )}
                {hasTasks && isSelected && (
                    <div className="absolute bottom-1.5 md:bottom-2 w-1 h-1 rounded-full bg-white/70"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
            {isSameDay(selectedDay, new Date()) ? 'Hoje' : selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        
        {tasksForSelectedDay.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-100 border-dashed">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-full mb-3 text-slate-300">
               <SlothIcon size={24} />
            </div>
            <p className="text-slate-500 text-sm">Nenhuma tarefa concluída neste dia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasksForSelectedDay.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                 <div className="mt-0.5 text-primary-500">
                    <CheckCircle size={20} fill="currentColor" className="text-white" />
                 </div>
                 <div>
                    <h4 className="font-medium text-slate-800 line-through text-opacity-70">{task.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Concluído às {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Horário desconhecido'}
                    </p>
                    {task.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {task.category}
                        </span>
                    )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};