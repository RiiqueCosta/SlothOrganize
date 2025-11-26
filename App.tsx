import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, FilterType, ViewType, User } from './types';
import { enhanceTaskWithAI } from './services/geminiService';
import { authService } from './services/authService';
import { TaskItem } from './components/TaskItem';
import { StatsCard } from './components/StatsCard';
import { CalendarView } from './components/CalendarView';
import { FocusTimer } from './components/FocusTimer';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { Button } from './components/Button';
import { Plus, ListFilter, Calendar, LayoutList, History, Timer, CalendarClock, Settings, X, Flag, LogOut } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true); // Controla o carregamento inicial da sessão
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(''); 
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.Medium);
  const [filter, setFilter] = useState<FilterType>('active');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('tasks');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Set Document Title
  useEffect(() => {
    document.title = "SlothOrganize";
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setIsLoading(false); // Finaliza o carregamento inicial
    };
    checkSession();
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    if (!user) return;

    // Chave dinâmica baseada no ID do usuário para isolar os dados
    const userStorageKey = `taskflow_data_${user.id}`;
    const saved = localStorage.getItem(userStorageKey);
    
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load tasks", e);
        setTasks([]);
      }
    } else {
      setTasks([]); // Limpa as tarefas se for um novo usuário sem dados
    }

    // Load user settings
    const userSettingsKey = `sloth_settings_${user.id}`;
    const savedSettings = localStorage.getItem(userSettingsKey);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSoundEnabled(settings.soundEnabled ?? true);
        setNotificationsEnabled(settings.notificationsEnabled ?? false);
      } catch (e) {}
    }
  }, [user]);

  // Save tasks to local storage (User specific)
  useEffect(() => {
    if (!user) return;
    const userStorageKey = `taskflow_data_${user.id}`;
    localStorage.setItem(userStorageKey, JSON.stringify(tasks));
  }, [tasks, user]);

  // Save settings to local storage (User specific)
  useEffect(() => {
    if (!user) return;
    const userSettingsKey = `sloth_settings_${user.id}`;
    localStorage.setItem(userSettingsKey, JSON.stringify({
      soundEnabled,
      notificationsEnabled
    }));
  }, [soundEnabled, notificationsEnabled, user]);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      authService.logout();
      setUser(null);
      setTasks([]); // Clear tasks from memory
      setActiveView('tasks');
    }
  };

  const uniqueCategories = useMemo(() => {
    // FIX: Replaced `.filter(Boolean)` with an explicit type guard to ensure TypeScript correctly infers `uniqueCategories` as `string[]`, resolving the error on `.map()`.
    return Array.from(new Set(tasks.map(t => t.category).filter((c): c is string => Boolean(c))));
  }, [tasks]);

  const addTask = (e?: React.FormEvent, customDate?: Date, titleOverride?: string) => {
    if (e) e.preventDefault();
    
    const titleToUse = titleOverride || newTaskTitle;
    if (!titleToUse.trim()) return;

    let finalDueDate = Date.now();
    
    if (customDate) {
      finalDueDate = customDate.getTime();
    } else if (newTaskDate) {
       const dateParts = newTaskDate.split('-');
       finalDueDate = new Date(
        parseInt(dateParts[0]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[2]), 
        12, 0, 0
      ).getTime();
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: titleToUse.trim(),
      priority: newTaskPriority, 
      completed: false,
      createdAt: Date.now(),
      dueDate: finalDueDate,
      subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    
    if (!titleOverride) {
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskPriority(Priority.Medium);
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

  const updateTask = (id: string, newTitle: string, newDate?: number, newPriority?: Priority, newCategory?: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          title: newTitle,
          dueDate: newDate !== undefined ? newDate : t.dueDate,
          priority: newPriority !== undefined ? newPriority : t.priority,
          category: newCategory !== undefined ? newCategory : t.category
        };
      }
      return t;
    }));
  };

  const snoozeTask = (id: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id !== id) return t;
        const baseDate = t.dueDate ? new Date(t.dueDate) : new Date();
        const tomorrow = new Date(baseDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return {
            ...t,
            dueDate: tomorrow.getTime()
        };
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

  // Settings Handlers
  const handleToggleNotifications = () => {
    if (!notificationsEnabled) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setNotificationsEnabled(true);
          }
        });
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const handleResetAll = () => {
    setTasks([]);
  };

  const cycleNewTaskPriority = () => {
    if (newTaskPriority === Priority.Low) setNewTaskPriority(Priority.Medium);
    else if (newTaskPriority === Priority.Medium) setNewTaskPriority(Priority.High);
    else setNewTaskPriority(Priority.Low);
  };

  const priorityFlagColors = {
    [Priority.High]: 'text-red-500 fill-red-500',
    [Priority.Medium]: 'text-amber-500 fill-amber-500',
    [Priority.Low]: 'text-blue-500 fill-blue-500',
  };

  const filteredTasks = tasks.filter(task => {
    if (activeView === 'tasks') {
        const todayEnd = new Date().setHours(23, 59, 59, 999);
        
        if (selectedCategory && task.category !== selectedCategory) {
            return false;
        }

        if (filter === 'active') {
            return !task.completed && (!task.dueDate || task.dueDate <= todayEnd);
        }
        if (filter === 'scheduled') {
            return !task.completed && task.dueDate && task.dueDate > todayEnd;
        }
        if (filter === 'completed') return task.completed;
    }
    return true; // 'all'
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

  // Grouped tasks logic for scheduled view
  const groupedScheduledTasks = useMemo<{ [key: string]: Task[] } | null>(() => {
    if (filter !== 'scheduled') return null;
    
    const groups: { [key: string]: Task[] } = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    sortedTasks.forEach(task => {
        if (!task.dueDate) return;
        const date = new Date(task.dueDate);
        date.setHours(0,0,0,0);
        
        let key = '';
        if (date.getTime() === tomorrow.getTime()) {
            key = 'Amanhã';
        } else {
             // Create a nice label like "Sexta-feira, 24/10"
             key = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' });
             key = key.charAt(0).toUpperCase() + key.slice(1);
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
    });
    return groups;
  }, [sortedTasks, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white animate-pulse">
           <SlothIcon size={24} />
        </div>
      </div>
    );
  }
  
  // Lógica Principal de Renderização: Se não houver usuário, mostra login
  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

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
              <p className="text-[10px] font-medium text-primary-600 uppercase tracking-widest">
                Olá, {user.name.split(' ')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden md:flex text-sm text-slate-500 items-center gap-2">
                <Calendar size={16} />
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
             </div>
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Configurações"
             >
                <Settings size={20} />
             </button>
             <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-1"
                title="Sair"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {activeView === 'tasks' && (
          <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">
            {/* Stats */}
            <StatsCard tasks={tasks} />

            {/* Input Area with Date Picker */}
            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-primary-500/5 border border-primary-100 relative">
              <form onSubmit={addTask} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="O que vamos fazer (ou não) hoje?"
                  className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-lg font-medium"
                />
                
                {/* Controls Row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                        {/* Priority Toggle */}
                        <button
                            type="button"
                            onClick={cycleNewTaskPriority}
                            className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                            title={`Prioridade: ${newTaskPriority}`}
                        >
                            <Flag size={20} className={priorityFlagColors[newTaskPriority]} />
                        </button>

                        {/* Date Picker Button */}
                        <div className="relative">
                            <button
                                type="button"
                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                                    newTaskDate ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-primary-600'
                                }`}
                                onClick={() => {
                                    const dateInput = document.getElementById('main-date-input');
                                    if(dateInput) (dateInput as HTMLInputElement).showPicker();
                                }}
                            >
                                <CalendarClock size={20} />
                                {newTaskDate && (
                                    <span className="text-xs font-semibold whitespace-nowrap hidden sm:inline">
                                        {new Date(newTaskDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                                    </span>
                                )}
                            </button>
                            {newTaskDate && (
                                <button 
                                    type="button"
                                    onClick={() => setNewTaskDate('')}
                                    className="absolute -top-2 -right-2 bg-slate-200 text-slate-500 rounded-full p-0.5 hover:bg-red-100 hover:text-red-500 z-10"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <input 
                                id="main-date-input"
                                type="date"
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="rounded-xl px-6"
                      disabled={!newTaskTitle.trim()}
                      icon={<Plus size={18} />}
                    >
                      Adicionar
                    </Button>
                </div>
              </form>
            </div>

            {/* Main Filters */}
            <div className="space-y-3">
                <div className="flex items-center justify-between overflow-x-auto">
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl whitespace-nowrap">
                    {(['all', 'active', 'scheduled', 'completed'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                        filter === f 
                            ? 'bg-white text-primary-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {f === 'all' && 'Todas'}
                        {f === 'active' && 'Hoje'}
                        {f === 'scheduled' && <><CalendarClock size={12} /> Futuro</>}
                        {f === 'completed' && 'Feitas'}
                    </button>
                    ))}
                </div>
                
                <div className="text-xs text-slate-400 flex items-center gap-1 pl-2">
                    <ListFilter size={14} />
                    <span className="hidden md:inline">{sortedTasks.length} tarefas</span>
                    <span className="md:hidden">{sortedTasks.length}</span>
                </div>
                </div>

                {/* Category Chips - Only show if we have categories */}
                {uniqueCategories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pl-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                                selectedCategory === null 
                                ? 'bg-slate-700 text-white border-slate-700 shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            Todas
                        </button>
                        {uniqueCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 ${
                                    cat === selectedCategory 
                                    ? 'bg-primary-100 text-primary-800 border-primary-200 font-medium' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Task List */}
            <div className="space-y-3 pb-8">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-full mb-4 text-primary-400">
                      <SlothIcon size={36} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                        {filter === 'scheduled' ? 'O futuro está livre' : 'Tudo tranquilo por aqui'}
                    </h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">
                        {filter === 'scheduled' 
                            ? 'Você não tem tarefas agendadas para os próximos dias.'
                            : selectedCategory 
                                ? `Nenhuma tarefa em "${selectedCategory}".` 
                                : 'Relaxe! Você não tem tarefas nesta visualização.'}
                    </p>
                </div>
              ) : (
                <>
                    {/* Render Grouped Tasks for Scheduled Filter */}
                    {filter === 'scheduled' && groupedScheduledTasks ? (
                        Object.entries(groupedScheduledTasks).map(([dateLabel, tasks]: [string, Task[]]) => (
                            <div key={dateLabel} className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-1 mt-4 mb-2 sticky top-[72px] bg-slate-50/95 py-2 z-10 backdrop-blur-sm">
                                    {dateLabel}
                                </h3>
                                {tasks.map(task => (
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
                                        onSnooze={snoozeTask}
                                        isEnhancing={loadingAI === task.id}
                                    />
                                ))}
                            </div>
                        ))
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
                            onSnooze={snoozeTask}
                            isEnhancing={loadingAI === task.id}
                        />
                        ))
                    )}
                </>
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
           <FocusTimer soundEnabled={soundEnabled} notificationsEnabled={notificationsEnabled} />
        )}

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notificationsEnabled={notificationsEnabled}
        soundEnabled={soundEnabled}
        onToggleNotifications={handleToggleNotifications}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onClearCompleted={handleClearCompleted}
        onResetAll={handleResetAll}
      />

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
            <span className="text-[10px] font-medium">Calendário</span>
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