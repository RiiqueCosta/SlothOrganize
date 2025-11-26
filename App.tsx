import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, FilterType, ViewType, User, Transaction } from './types';
import { enhanceTaskWithAI } from './services/geminiService';
import { authService } from './services/authService';
import { TaskItem } from './components/TaskItem';
import { StatsCard } from './components/StatsCard';
import { CalendarView } from './components/CalendarView';
import { FocusTimer } from './components/FocusTimer';
import { FinanceView } from './components/FinanceView';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { Button } from './components/Button';
import { Plus, ListFilter, Calendar, LayoutList, History, Timer, CalendarClock, Settings, X, Flag, LogOut, Wallet, Clock } from 'lucide-react';

const SlothIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 6h20" className="opacity-70" /><path d="M7 6v4a3 3 0 0 0 3 3" /><path d="M17 6v4a3 3 0 0 1-3 3" /><path d="M10 13h4" /><path d="M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /><path d="M10 16h.01" /><path d="M14 16h.01" /><path d="M11 18c.5.5 1.5.5 2 0" />
  </svg>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(''); 
  const [newTaskTime, setNewTaskTime] = useState(''); 
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.Medium);
  
  const [filter, setFilter] = useState<FilterType>('active');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('tasks');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => { document.title = "SlothOrganize"; }, []);

  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) setUser(currentUser);
      setIsLoading(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userKey = `taskflow_data_${user.id}`;
    const financeKey = `taskflow_finance_${user.id}`;
    const saved = localStorage.getItem(userKey);
    const savedFinance = localStorage.getItem(financeKey);
    
    if (saved) { try { setTasks(JSON.parse(saved)); } catch { setTasks([]); } } else { setTasks([]); }
    if (savedFinance) { try { setTransactions(JSON.parse(savedFinance)); } catch { setTransactions([]); } } else { setTransactions([]); }

    const settingsKey = `sloth_settings_${user.id}`;
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try { const s = JSON.parse(savedSettings); setSoundEnabled(s.soundEnabled ?? true); setNotificationsEnabled(s.notificationsEnabled ?? false); } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`taskflow_data_${user.id}`, JSON.stringify(tasks));
    localStorage.setItem(`taskflow_finance_${user.id}`, JSON.stringify(transactions));
    localStorage.setItem(`sloth_settings_${user.id}`, JSON.stringify({ soundEnabled, notificationsEnabled }));
  }, [tasks, transactions, soundEnabled, notificationsEnabled, user]);

  const handleLogout = () => { if (window.confirm("Sair?")) { authService.logout(); setUser(null); setTasks([]); setTransactions([]); setActiveView('tasks'); } };
  const uniqueCategories = useMemo(() => Array.from(new Set(tasks.map(t => t.category).filter((c): c is string => Boolean(c)))), [tasks]);

  const addTask = (e?: React.FormEvent, customDate?: Date, titleOverride?: string) => {
    if (e) e.preventDefault();
    const titleToUse = titleOverride || newTaskTitle;
    if (!titleToUse.trim()) return;

    let finalDueDate = Date.now();
    if (customDate) finalDueDate = customDate.getTime();
    else if (newTaskDate) {
       const parts = newTaskDate.split('-');
       finalDueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0).getTime();
    }

    const newTask: Task = {
      id: crypto.randomUUID(), title: titleToUse.trim(), priority: newTaskPriority, completed: false, createdAt: Date.now(), dueDate: finalDueDate, dueTime: newTaskTime || undefined, duration: newTaskDuration ? parseInt(newTaskDuration) : undefined, subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    if (!titleOverride) { setNewTaskTitle(''); setNewTaskDate(''); setNewTaskTime(''); setNewTaskDuration(''); setNewTaskPriority(Priority.Medium); }
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: crypto.randomUUID() }]);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

  const updateTask = (id: string, newTitle: string, newDate?: number, newPriority?: Priority, newCategory?: string, newTime?: string, newDuration?: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle, dueDate: newDate ?? t.dueDate, priority: newPriority ?? t.priority, category: newCategory ?? t.category, dueTime: newTime ?? t.dueTime, duration: newDuration ?? t.duration } : t));
  };
  const toggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t));
  const snoozeTask = (id: string) => setTasks(prev => prev.map(t => { if (t.id !== id) return t; const d = t.dueDate ? new Date(t.dueDate) : new Date(); d.setDate(d.getDate()+1); return { ...t, dueDate: d.getTime() }; }));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const toggleSubtask = (tid: string, sid: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s) }));
  const addSubtask = (tid: string, title: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: [...t.subtasks, { id: crypto.randomUUID(), title, completed: false }] }));
  const deleteSubtask = (tid: string, sid: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: t.subtasks.filter(s => s.id !== sid) }));
  const handleEnhanceTask = async (task: Task) => { setLoadingAI(task.id); const res = await enhanceTaskWithAI(task.title); if(res) { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, description: res.description, priority: res.priority === 'Alta' ? Priority.High : res.priority === 'Baixa' ? Priority.Low : Priority.Medium, category: res.category, subtasks: [...t.subtasks, ...res.subtasks.map(st => ({ id: crypto.randomUUID(), title: st, completed: false }))] } : t)); } setLoadingAI(null); };

  const handleToggleNotifications = () => { if (!notificationsEnabled && Notification.permission !== 'granted') { Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted')); } else { setNotificationsEnabled(!notificationsEnabled); } };
  const handleClearCompleted = () => setTasks(prev => prev.filter(t => !t.completed));
  const handleResetAll = () => { setTasks([]); setTransactions([]); };
  const cycleNewTaskPriority = () => setNewTaskPriority(p => p===Priority.Low?Priority.Medium:p===Priority.Medium?Priority.High:Priority.Low);
  const priorityFlagColors = { [Priority.High]: 'text-red-500 fill-red-500', [Priority.Medium]: 'text-amber-500 fill-amber-500', [Priority.Low]: 'text-blue-500 fill-blue-500' };

  const filteredTasks = tasks.filter(task => { 
      if(activeView !== 'tasks') return true; 
      if (selectedCategory && task.category !== selectedCategory) return false; 
      if (filter === 'active') return !task.completed && (!task.dueDate || task.dueDate <= new Date().setHours(23,59,59,999)); 
      if (filter === 'scheduled') return !task.completed && task.dueDate && task.dueDate > new Date().setHours(23,59,59,999); 
      if (filter === 'completed') return task.completed; 
      return true; 
  });
  const sortedTasks = [...filteredTasks].sort((a, b) => { if (a.completed === b.completed) { return a.completed ? (b.completedAt||0)-(a.completedAt||0) : (a.dueDate||0)-(b.dueDate||0); } return a.completed ? 1 : -1; });

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><SlothIcon size={24} /></div>;
  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 md:pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30"><SlothIcon size={24} /></div>
            <div><h1 className="text-xl font-bold text-slate-900">SlothOrganize</h1><p className="text-[10px] font-medium text-primary-600 uppercase">Olá, {user.name.split(' ')[0]}</p></div>
          </div>
          <div className="flex items-center gap-2"><button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400"><Settings size={20} /></button><button onClick={handleLogout} className="p-2 text-slate-400"><LogOut size={20} /></button></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {activeView === 'tasks' && (
          <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">
            <StatsCard tasks={tasks} />
            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-primary-500/5 border border-primary-100 relative">
              <form onSubmit={addTask} className="flex flex-col gap-3">
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="O que vamos fazer hoje?" className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-lg font-medium" />
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button type="button" onClick={cycleNewTaskPriority} className="p-2 rounded-lg hover:bg-slate-50"><Flag size={20} className={priorityFlagColors[newTaskPriority]} /></button>
                        <div className="relative">
                            <button type="button" className={`p-2 rounded-lg flex items-center gap-2 ${newTaskDate ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`} onClick={() => (document.getElementById('main-date-input') as HTMLInputElement).showPicker()}><CalendarClock size={20} /></button>
                            <input id="main-date-input" type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1 gap-1"><Clock size={14} className="text-slate-400" /><input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="bg-transparent text-xs outline-none w-16" /></div>
                        <input type="number" placeholder="Min" value={newTaskDuration} onChange={(e) => setNewTaskDuration(e.target.value)} className="w-12 text-xs px-2 py-1.5 bg-slate-50 rounded-lg outline-none" />
                    </div>
                    <Button type="submit" className="rounded-xl px-6" disabled={!newTaskTitle.trim()} icon={<Plus size={18} />}>Adicionar</Button>
                </div>
              </form>
            </div>
            <div className="space-y-3">
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl whitespace-nowrap w-full overflow-x-auto">
                    {(['all', 'active', 'scheduled', 'completed'] as FilterType[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === f ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{f === 'all' ? 'Todas' : f === 'active' ? 'Hoje' : f === 'scheduled' ? 'Futuro' : 'Feitas'}</button>
                    ))}
                </div>
                <div className="space-y-3 pb-8">
                    {sortedTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={updateTask} onToggleSubtask={toggleSubtask} onAddSubtask={addSubtask} onDeleteSubtask={deleteSubtask} onEnhance={handleEnhanceTask} onSnooze={snoozeTask} isEnhancing={loadingAI === task.id} />
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeView === 'finance' && <FinanceView transactions={transactions} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} />}
        {activeView === 'calendar' && <CalendarView tasks={tasks} onAddTask={(title, date) => addTask(undefined, date, title)} />}
        {activeView === 'focus' && <FocusTimer soundEnabled={soundEnabled} notificationsEnabled={notificationsEnabled} />}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} notificationsEnabled={notificationsEnabled} soundEnabled={soundEnabled} onToggleNotifications={handleToggleNotifications} onToggleSound={() => setSoundEnabled(!soundEnabled)} onClearCompleted={handleClearCompleted} onResetAll={handleResetAll} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 md:hidden safe-area-pb">
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto">
          <button onClick={() => setActiveView('tasks')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'tasks' ? 'text-primary-600' : 'text-slate-400'}`}><LayoutList size={20} /><span className="text-[10px]">Tarefas</span></button>
          <button onClick={() => setActiveView('finance')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'finance' ? 'text-primary-600' : 'text-slate-400'}`}><Wallet size={20} /><span className="text-[10px]">Gastos</span></button>
          <button onClick={() => setActiveView('focus')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'focus' ? 'text-primary-600' : 'text-slate-400'}`}><Timer size={20} /><span className="text-[10px]">Foco</span></button>
          <button onClick={() => setActiveView('calendar')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'calendar' ? 'text-primary-600' : 'text-slate-400'}`}><History size={20} /><span className="text-[10px]">Histórico</span></button>
        </div>
      </nav>
      
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <div className="bg-white rounded-full shadow-xl border border-slate-100 p-1 flex flex-col gap-1">
           <button onClick={() => setActiveView('tasks')} className={`p-3 rounded-full ${activeView === 'tasks' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutList size={20} /></button>
           <button onClick={() => setActiveView('finance')} className={`p-3 rounded-full ${activeView === 'finance' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Wallet size={20} /></button>
           <button onClick={() => setActiveView('focus')} className={`p-3 rounded-full ${activeView === 'focus' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Timer size={20} /></button>
           <button onClick={() => setActiveView('calendar')} className={`p-3 rounded-full ${activeView === 'calendar' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><History size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
