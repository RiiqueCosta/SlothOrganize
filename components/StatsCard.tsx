import React from 'react';
import { Task } from '../types';

interface StatsCardProps {
  tasks: Task[];
}

export const StatsCard: React.FC<StatsCardProps> = ({ tasks }) => {
  const completed = tasks.filter(t => t.completed).length;
  const active = tasks.filter(t => !t.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // SVG Circle calculations
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between">
      <div className="flex flex-col mb-4 md:mb-0">
        <h3 className="text-lg font-semibold text-slate-800">Seu Progresso</h3>
        <p className="text-slate-500 text-sm">Continue firme! Você completou {percentage}% das tarefas.</p>
        
        <div className="flex gap-6 mt-4">
          <div>
            <span className="block text-2xl font-bold text-slate-800">{active}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">A Fazer</span>
          </div>
          <div>
            <span className="block text-2xl font-bold text-primary-600">{completed}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Feitas</span>
          </div>
        </div>
      </div>

      <div className="h-24 w-24 relative flex items-center justify-center">
         {/* Custom SVG Pie Chart */}
         <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
         </svg>
         
         {/* Center text */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-slate-400">{percentage}%</span>
         </div>
      </div>
    </div>
  );
};