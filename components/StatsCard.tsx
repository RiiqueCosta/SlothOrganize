import React from 'react';
import { Task } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsCardProps {
  tasks: Task[];
}

export const StatsCard: React.FC<StatsCardProps> = ({ tasks }) => {
  const completed = tasks.filter(t => t.completed).length;
  const active = tasks.filter(t => !t.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  const data = [
    { name: 'Concluídas', value: completed },
    { name: 'Pendentes', value: active },
  ];

  // Updated to match the new Emerald primary color #10b981
  const COLORS = ['#10b981', '#e2e8f0']; 

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

      <div className="h-24 w-24 relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={40}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip cursor={false} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
         </ResponsiveContainer>
         {/* Center text for the chart */}
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-slate-400">{percentage}%</span>
         </div>
      </div>
    </div>
  );
};