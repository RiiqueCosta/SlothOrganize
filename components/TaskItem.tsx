
import React, { useState, useRef, useEffect } from 'react';
import { Task, Priority } from '../types';
import { Trash2, ChevronDown, ChevronUp, CheckCircle, Circle, Sparkles, Folder, Pencil, Check, X, Plus } from 'lucide-react';
import { Button } from './Button';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newTitle: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onEnhance: (task: Task) => void;
  isEnhancing: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdate,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onEnhance,
  isEnhancing
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const priorityColors = {
    [Priority.High]: 'bg-red-100 text-red-700',
    [Priority.Medium]: 'bg-amber-100 text-amber-700',
    [Priority.Low]: 'bg-blue-100 text-blue-700',
  };

  const handleEnhanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnhance(task);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, editTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  return (
    <div 
      className={`group bg-white rounded-xl border transition-all duration-200 ${
        task.completed ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-primary-100'
      }`}
    >
      <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={(e) => {
        // Don't expand if clicking inside edit input
        if (!isEditing) setIsExpanded(!isExpanded);
      }}>
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          className={`mt-1 flex-shrink-0 transition-colors ${
            task.completed ? 'text-primary-500' : 'text-slate-300 hover:text-primary-500'
          }`}
        >
          {task.completed ? <CheckCircle size={22} fill="currentColor" className="text-white" /> : <Circle size={22} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={handleSaveEdit} className="text-primary-600 hover:bg-primary-50 p-1 rounded">
                <Check size={16} />
              </button>
              <button onClick={handleCancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-medium text-slate-800 break-words ${task.completed ? 'line-through text-slate-400' : ''}`}>
                {task.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
               {task.category && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <Folder size={10} />
                      {task.category}
                  </span>
              )}
            </div>
          )}
          
          {task.description && !isEditing && (
            <p className={`text-sm text-slate-500 line-clamp-2 ${task.completed ? 'text-slate-300' : ''}`}>
              {task.description}
            </p>
          )}

          {/* Subtask Progress Bar (Mini) */}
          {task.subtasks.length > 0 && !task.completed && !isEditing && (
            <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-slate-400 font-medium">
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!task.completed && (
              <Button
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                title="Editar"
              >
                <Pencil size={16} />
              </Button>
            )}
            {!task.completed && task.subtasks.length === 0 && !task.description && (
              <Button
                  variant="ghost"
                  onClick={handleEnhanceClick}
                  disabled={isEnhancing}
                  title="Melhorar com IA"
                  className="text-primary-600 hover:bg-primary-50"
              >
                  <Sparkles size={16} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </Button>
            <div className="text-slate-300">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && !isEditing && (
        <div className="px-4 pb-4 pt-0 pl-11">
           {/* Manual Subtask Input */}
           <div className="mt-2 mb-3">
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                 <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Adicionar um passo..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                 />
                 <Button 
                   type="submit" 
                   size="sm" 
                   disabled={!newSubtaskTitle.trim()} 
                   className="py-1 px-2 h-auto"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <Plus size={14} />
                 </Button>
              </form>
           </div>

           {/* Subtasks List */}
           {task.subtasks.length > 0 && (
            <div className="space-y-1">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center gap-3 p-1 hover:bg-slate-50 rounded group/sub">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSubtask(task.id, subtask.id);
                    }}
                    className={`transition-colors ${
                      subtask.completed ? 'text-primary-500' : 'text-slate-300 hover:text-primary-400'
                    }`}
                  >
                   {subtask.completed ? <CheckCircle size={16} fill="currentColor" className="text-white" /> : <Circle size={16} />}
                  </button>
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                    {subtask.title}
                  </span>
                  <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubtask(task.id, subtask.id);
                     }}
                     className="text-slate-300 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

           {/* If no subtasks and not completed, offer AI generation again */}
           {!task.completed && task.subtasks.length === 0 && (
             <div className="mt-2">
                 <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs py-1.5 gap-2 border-dashed border-primary-200 text-primary-600 bg-primary-50/50"
                    onClick={(e) => { e.stopPropagation(); onEnhance(task); }}
                    isLoading={isEnhancing}
                    icon={<Sparkles size={14} />}
                 >
                    {isEnhancing ? 'A IA está pensando...' : 'Sugerir passos com IA'}
                 </Button>
             </div>
           )}
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Criado em {new Date(task.createdAt).toLocaleDateString()}</span>
            {task.dueDate && (
               <span>Agendado: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
