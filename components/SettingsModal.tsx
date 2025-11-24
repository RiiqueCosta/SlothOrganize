import React from 'react';
import { X, Bell, Volume2, Trash2, Info, Moon } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onToggleNotifications: () => void;
  onToggleSound: () => void;
  onClearCompleted: () => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  notificationsEnabled,
  soundEnabled,
  onToggleNotifications,
  onToggleSound,
  onClearCompleted,
  onResetAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary-50 px-6 py-4 flex items-center justify-between border-b border-primary-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Configurações
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferências</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Notificações</p>
                  <p className="text-xs text-slate-500">Avisar quando o timer acabar</p>
                </div>
              </div>
              <button 
                onClick={onToggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-primary-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Volume2 size={18} />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Sons</p>
                  <p className="text-xs text-slate-500">Efeitos sonoros suaves</p>
                </div>
              </div>
              <button 
                onClick={onToggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-primary-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados</h3>
            
            <Button 
              variant="secondary" 
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              onClick={() => {
                if(window.confirm('Tem certeza que deseja remover todas as tarefas concluídas?')) {
                  onClearCompleted();
                  onClose();
                }
              }}
              icon={<Trash2 size={16} />}
            >
              Limpar tarefas concluídas
            </Button>

            <Button 
               variant="ghost"
               className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-700 text-xs"
               onClick={() => {
                 if(window.confirm('CUIDADO: Isso apagará TODOS os seus dados e reiniciará o aplicativo. Deseja continuar?')) {
                   onResetAll();
                   onClose();
                 }
               }}
            >
              Resetar aplicativo (Apagar tudo)
            </Button>
          </div>

          {/* About */}
          <div className="bg-slate-50 p-3 rounded-xl flex items-start gap-3 text-xs text-slate-500 border border-slate-100">
            <Info size={16} className="shrink-0 mt-0.5 text-primary-500" />
            <p>
              O <strong>SlothOrganize</strong> usa a filosofia "Slow Productivity". 
              Não se culpe por adiar tarefas. O importante é a constância, não a velocidade.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};