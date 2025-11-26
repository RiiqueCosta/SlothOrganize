import React, { useState, useRef, useEffect } from 'react';
import { Task, Priority } from '../types';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, Circle, Sparkles, Folder, Pencil, Check, X, Plus, CalendarClock, Moon, Flag, Tag, Clock, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newTitle: string, newDate?: number, newPriority?: Priority, newCategory?: string, newTime?: string, newDuration?: number) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onEnhance: (task: Task) => void;
  onSnooze: (id: string) => void;
  isEnhancing: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, onToggle, onDelete, onUpdate, onToggleSubtask, onAddSubtask, onDeleteSubtask, onEnhance, onSnooze, isEnhancing
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category || '');
  const [editTime, setEditTime] = useState(task.dueTime || '');
  const [editDuration, setEditDuration] = useState(task.duration?.toString() || '');
  const [editDate, setEditDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  const priorityColors = { [Priority.High]: 'bg-red-100 text-red-700', [Priority.Medium]: 'bg-amber-100 text-amber-700', [Priority.Low]: 'bg-blue-100 text-blue-700' };
  const priorityFlagColors = { [Priority.High]: 'text-red-500 fill-red-500', [Priority.Medium]: 'text-amber-500 fill-amber-500', [Priority.Low]: 'text-blue-500 fill-blue-500' };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      const dateParts = editDate.split('-');
      const newTimestamp = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 12, 0, 0).getTime();
      onUpdate(task.id, editTitle.trim(), newTimestamp, editPriority, editCategory.trim(), editTime, editDuration ? parseInt(editDuration) : undefined);
      setIsEditing(false);
    }
  };

  const checkOverdue = () => {
    if (task.completed || !task.dueDate) return false;
    const now = new Date();
    const taskDate = new Date(task.dueDate);
    if (taskDate.setHours(0,0,0,0) < now.setHours(0,0,0,0)) return true;
    if (taskDate.toDateString() === now.toDateString() && task.dueTime) {
        const [h, m] = task.dueTime.split(':').map(Number);
        if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) return true;
    }
    return false;
  };

  const isOverdue = checkOverdue();
  const isFuture = task.dueDate && task.dueDate > new Date().setHours(23, 59, 59, 999);
  const isToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

  return (
    <div className={`group bg-white rounded-xl border transition-all duration-200 ${task.completed ? 'border-slate-100 bg-slate-50/50' : isOverdue ? 'border-red-200 bg-red-50/30 shadow-sm' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => !isEditing && setIsExpanded(!isExpanded)}>
        <button onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} className={`mt-1 flex-shrink-0 ${task.completed ? 'text-primary-500' : isOverdue ? 'text-red-500' : 'text-slate-300'}`}>
          {task.completed ? <CheckCircle size={22} fill="currentColor" className="text-white" /> : <Circle size={22} />}
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 mb-1" onClick={e => e.stopPropagation()}>
              <input ref={inputRef} type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 text-sm border border-primary-300 rounded outline-none" />
              <div className="grid grid-cols-2 gap-2">
                 <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="px-2 py-1 text-xs border border-slate-300 rounded" />
                 <div className="flex gap-1"><input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded" /><input type="number" placeholder="Min" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-14 px-2 py-1 text-xs border border-slate-300 rounded" /></div>
              </div>
              <div className="flex gap-2 justify-end mt-1"><Button size="sm" onClick={handleSaveEdit}>Salvar</Button><Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button></div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-medium break-words ${task.completed ? 'line-through text-slate-400' : isOverdue ? 'text-red-700' : 'text-slate-800'}`}>{task.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                    {task.dueTime && <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}><Clock size={10} /> {task.dueTime}</span>}
                    {task.category && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600"><Folder size={10} /> {task.category}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {task.dueDate && !task.completed && <div className={`flex items-center gap-1 text-[10px] font-medium w-fit px-1.5 py-0.5 rounded ${isFuture ? 'bg-indigo-50 text-indigo-600' : isToday ? 'bg-amber-50 text-amber-600' : 'text-slate-400'}`}><CalendarClock size={12} />{isToday ? 'Hoje' : new Date(task.dueDate).toLocaleDateString('pt-BR')}</div>}
                    {isOverdue && !task.completed && <div className="flex items-center gap-1 text-xs text-red-600 font-bold animate-pulse"><AlertCircle size={12} /> Atrasada</div>}
                </div>
            </div>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {!task.completed && <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onSnooze(task.id); }}><Moon size={16} /></Button>}
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}><Pencil size={16} /></Button>
            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}><Trash2 size={16} /></Button>
          </div>
        )}
      </div>
      {isExpanded && !isEditing && (
        <div className="px-4 pb-4 pt-0 pl-11">
           <div className="mt-2 mb-3">
              <form onSubmit={(e) => { e.preventDefault(); if(newSubtaskTitle.trim()){ onAddSubtask(task.id, newSubtaskTitle); setNewSubtaskTitle(''); } }} className="flex gap-2">
                 <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Adicionar passo..." className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                 <Button type="submit" size="sm"><Plus size={14} /></Button>
              </form>
           </div>
           {task.subtasks.length > 0 && <div className="space-y-1">{task.subtasks.map(st => (<div key={st.id} className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded group/sub"><button onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, st.id); }} className={st.completed ? 'text-primary-500' : 'text-slate-300'}>{st.completed ? <CheckCircle size={16} fill="currentColor" className="text-white" /> : <Circle size={16} />}</button><span className={`flex-1 text-sm ${st.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>{st.title}</span><button onClick={(e) => { e.stopPropagation(); onDeleteSubtask(task.id, st.id); }} className="text-slate-300 hover:text-red-400 opacity-0 group-hover/sub:opacity-100"><X size={14} /></button></div>))}</div>}
           {!task.completed && task.subtasks.length === 0 && <div className="mt-2"><Button variant="secondary" size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); onEnhance(task); }} isLoading={isEnhancing} icon={<Sparkles size={14} />}>{isEnhancing ? 'Pensando...' : 'Sugerir passos com IA'}</Button></div>}
        </div>
      )}
    </div>
  );
};