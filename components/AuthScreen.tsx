import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Button } from './Button';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

// Ícone do Bicho-Preguiça exclusivo para a tela de login
const SlothLoginIcon = ({ size = 64 }: { size?: number }) => (
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
    className="text-primary-600"
  >
    <path d="M2 12h20" className="opacity-30" />
    <path d="M7 12v3a3 3 0 0 0 3 3" />
    <path d="M17 12v3a3 3 0 0 1-3 3" />
    <path d="M10 15h4" />
    <path d="M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
    <path d="M10 17h.01" />
    <path d="M14 17h.01" />
    <path d="M11 19c.5.5 1.5.5 2 0" />
  </svg>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isLogin) {
      const user = await authService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } else {
      if (!name.trim()) {
        setError('Por favor, informe seu nome.');
        setIsLoading(false);
        return;
      }
      const result = await authService.register(name, email, password);
      if ('error' in result) {
        setError(result.error);
      } else {
        onLogin(result);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-primary-50 p-8 text-center flex flex-col items-center border-b border-primary-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <SlothLoginIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SlothOrganize</h1>
          <p className="text-primary-600 font-medium text-sm mt-1">Produtividade no seu ritmo</p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-base rounded-xl mt-4 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30" 
              isLoading={isLoading}
              icon={!isLoading && <ArrowRight size={20} />}
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="ml-1 text-primary-600 font-semibold hover:underline focus:outline-none"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
        Seus dados são armazenados localmente no seu navegador de forma isolada.
      </p>
    </div>
  );
};