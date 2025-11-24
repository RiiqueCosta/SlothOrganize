
import React, { useState, useEffect } from 'react';
import { Task, Priority, FilterType, ViewType } from './types';
import { enhanceTaskWithAI } from './services/geminiService';
import { TaskItem } from './components/TaskItem';
import { StatsCard } from './components/StatsCard';
import { CalendarView } from './components/CalendarView';
import { FocusTimer } from './components/FocusTimer';
import { Button } from './components/Button';
import { Plus, ListFilter, Calendar, LayoutList, History, Timer } from 'lucide-react';

// Custom Sloth Icon Component
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
    {/* Branch */}
    <path d="M2 6h20" className="opacity-70" />
    {/* Left Arm hanging */}
    <path d="M7 6v4a3 3 0 0 0 3 3" />
    {/* Right Arm hanging */}
    <path d="M17 6v4a3 3 0 0 1-3 3" />
    {/* Body/Head simplified */}
    <path d="M10 13h4" /> {/* Connecting arms */}
    <path d="M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /> {/* Head */}
    {/* Face */}
    <path d="M10 16h.01" /> {/* Eye */}
    <path d="M14 16h.01" /> {/* Eye */}
    <path d="M11 18c.5.5 1.5.5 2 0" /> {/* Smile */}
  </svg>
);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('tasks');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('taskflow_data');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('taskflow_data', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e?: React.FormEvent, customDate?: Date, titleOverride?: string) => {
    if (e) e.preventDefault();
    
    const titleToUse = titleOverride || newTaskTitle;
    if (!titleToUse.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: titleToUse.trim(),
      priority: Priority.Medium, // Default
      completed: false,
      createdAt: Date.now(),
      dueDate: customDate ? customDate.getTime() : Date.now(),
      subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    
    if (!titleOverride) {
      setNewTaskTitle('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const isCompleted = !t.completed;
        return { 
          ...t, 
          completed: isCompleted,
          completedAt: isCompleted ? Date.now() : undefined 
        };
      }
      return t;
    }));
  };

  const updateTask = (id: string, newTitle: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, title: newTitle };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        subtasks: task.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      };
    }));
  };

  const addSubtask = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, { id: crypto.randomUUID(), title, completed: false }]
      };
    }));
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId)
      };
    }));
  };

  const handleEnhanceTask = async (task: Task) => {
    setLoadingAI(task.id);
    const enhancement = await enhanceTaskWithAI(task.title);
    
    if (enhancement) {
      setTasks(prev => prev.map(t => {
        if (t.id !== task.id) return t;
        
        let newPriority = Priority.Medium;
        if (enhancement.priority === 'Alta') newPriority = Priority.High;
        if (enhancement.priority === 'Baixa') newPriority = Priority.Low;

        return {
          ...t,
          description: enhancement.description,
          priority: newPriority,
          category: enhancement.category,
          subtasks: [
            ...t.subtasks, // Keep existing ones
            ...enhancement.subtasks.map(st => ({
              id: crypto.randomUUID(),
              title: st,
              completed: false
            }))
          ]
        };
      }));
    }
    setLoadingAI(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeView === 'tasks') {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (a.completed === b.completed) {
         const dateA = a.completed ? (a.completedAt || 0) : (a.dueDate || a.createdAt);
         const dateB = b.completed ? (b.completedAt || 0) : (b.dueDate || b.createdAt);
         
         if (Math.abs(dateA - dateB) < 86400000) {
            const weight = { [Priority.High]: 3, [Priority.Medium]: 2, [Priority.Low]: 1 };
            return weight[b.priority] - weight[a.priority];
         }
         return a.completed ? dateB - dateA : dateA - dateB;
      }
      return a.completed ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 md:pb-10">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 transform hover:rotate-6 transition-transform cursor-pointer">
              <SlothIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">SlothOrganize</h1>
              <p className="text-[10px] font-medium text-primary-600 uppercase tracking-widest">No seu ritmo</p>
            </div>
          </div>
          <div className="hidden md:flex text-sm text-slate-500 items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {activeView === 'tasks' && (
          <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">
            {/* Stats */}
            <StatsCard tasks={tasks} />

            {/* Input Area */}
            <div className="bg-white p-2 rounded-2xl shadow-lg shadow-primary-500/5 border border-primary-100">
              <form onSubmit={addTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="O que vamos fazer (ou não) hoje?"
                  className="flex-1 px-4 py-3 bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-base"
                />
                <Button 
                  type="submit" 
                  className="rounded-xl px-4 md:px-6"
                  disabled={!newTaskTitle.trim()}
                  icon={<Plus size={20} />}
                >
                  <span className="hidden md:inline">Adicionar</span>
                </Button>
              </form>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl">
                {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all ${
                      filter === f 
                        ? 'bg-white text-primary-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f === 'all' && 'Todas'}
                    {f === 'active' && 'Pendentes'}
                    {f === 'completed' && 'Feitas'}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <ListFilter size={14} />
                <span className="hidden md:inline">{sortedTasks.length} tarefas</span>
                <span className="md:hidden">{sortedTasks.length}</span>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3 pb-8">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-4 text-primary-400">
                      <SlothIcon size={36} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Tudo tranquilo por aqui</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">Relaxe! Você não tem tarefas pendentes nesta visualização.</p>
                </div>
              ) : (
                sortedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onToggleSubtask={toggleSubtask}
                    onAddSubtask={addSubtask}
                    onDeleteSubtask={deleteSubtask}
                    onEnhance={handleEnhanceTask}
                    isEnhancing={loadingAI === task.id}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeView === 'calendar' && (
          <CalendarView 
            tasks={tasks} 
            onAddTask={(title, date) => addTask(undefined, date, title)}
          />
        )}

        {activeView === 'focus' && (
           <FocusTimer />
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 md:hidden safe-area-pb">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          <button 
            onClick={() => setActiveView('tasks')}
            className={`flex flex-col items-center justify-center gap-1 ${activeView === 'tasks' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-1 rounded-full ${activeView === 'tasks' ? 'bg-primary-50' : ''}`}>
              <LayoutList size={22} strokeWidth={activeView === 'tasks' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">Tarefas</span>
          </button>

          <button 
            onClick={() => setActiveView('focus')}
            className={`flex flex-col items-center justify-center gap-1 ${activeView === 'focus' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`p-1 rounded-full ${activeView === 'focus' ? 'bg-primary-50' : ''}`}>
              <Timer size={22} strokeWidth={activeView === 'focus' ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">Foco</span>
          </button>
          
          <button 
            onClick={() => setActiveView('calendar')}
            className={`flex flex-col items-center justify-center gap-1 ${activeView === 'calendar' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             <div className={`p-1 rounded-full ${activeView === 'calendar' ? 'bg-primary-50' : ''}`}>
              <History size={22} strokeWidth={activeView === 'calendar' ? 2.5 : 2} />
             </div>
            <span className="text-[10px] font-medium">Histórico</span>
          </button>
        </div>
      </nav>

      {/* Desktop view switcher */}
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <div className="bg-white rounded-full shadow-xl border border-slate-100 p-1 flex flex-col gap-1">
           <button 
            onClick={() => setActiveView('tasks')}
            className={`p-3 rounded-full transition-all ${activeView === 'tasks' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
            title="Lista de Tarefas"
           >
             <LayoutList size={20} />
           </button>
           <button 
            onClick={() => setActiveView('focus')}
            className={`p-3 rounded-full transition-all ${activeView === 'focus' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
             title="Modo Foco"
           >
             <Timer size={20} />
           </button>
           <button 
            onClick={() => setActiveView('calendar')}
            className={`p-3 rounded-full transition-all ${activeView === 'calendar' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
             title="Histórico e Calendário"
           >
             <History size={20} />
           </button>
        </div>
      </div>

    </div>
  );
};

export default App;
