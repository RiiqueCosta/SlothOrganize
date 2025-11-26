import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Button } from './Button';
import { Plus, Minus, TrendingUp, TrendingDown, Wallet, Trash2, Download } from 'lucide-react';

interface FinanceViewProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    onAddTransaction({
      description,
      amount: parseFloat(amount),
      type,
      date: Date.now()
    });

    setDescription('');
    setAmount('');
  };

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  // Simple Donut Chart Data
  const totalVolume = stats.income + stats.expense;
  const expensePercentage = totalVolume === 0 ? 0 : (stats.expense / totalVolume) * 100;
  
  // SVG calc
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const expenseDash = (expensePercentage / 100) * circumference;

  const handleDownload = () => {
    if (transactions.length === 0) return;

    const headers = ['Data', 'Descrição', 'Tipo', 'Valor (R$)'];
    let csvContent = headers.join(',') + '\n';

    const sortedTransactions = [...transactions].sort((a, b) => a.date - b.date);

    sortedTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const description = `"${t.description.replace(/"/g, '""')}"`; // Handle quotes
      const type = t.type === 'income' ? 'Entrada' : 'Saída';
      const amount = t.amount.toFixed(2).replace('.', ',');

      const row = [date, description, type, amount].join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel compatibility
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'relatorio_financeiro_sloth_organize.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Balance Card & Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Saldo Atual</p>
            <h2 className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              R$ {stats.balance.toFixed(2)}
            </h2>
          </div>
          <div className="relative w-24 h-24">
             <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#10b981" strokeWidth="12" /> {/* Income Base */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent" 
                  stroke="#ef4444" 
                  strokeWidth="12" 
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - expenseDash}
                  className="transition-all duration-1000"
                />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
               <Wallet size={20} className="text-slate-400" />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-emerald-50 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <div className="p-1 bg-emerald-100 rounded-full"><TrendingUp size={14} /></div>
              <span className="text-xs font-bold uppercase">Entradas</span>
            </div>
            <p className="text-lg font-semibold text-emerald-700">R$ {stats.income.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <div className="p-1 bg-red-100 rounded-full"><TrendingDown size={14} /></div>
              <span className="text-xs font-bold uppercase">Saídas</span>
            </div>
            <p className="text-lg font-semibold text-red-700">R$ {stats.expense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Adicionar Movimentação</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${type === 'expense' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-500'}`}
            >
              <Minus size={16} /> Gastei
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${type === 'income' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500'}`}
            >
              <Plus size={16} /> Recebi
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Descrição (ex: Almoço)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit" size="sm" className="w-full rounded-lg" disabled={!description || !amount}>
            Adicionar
          </Button>
        </form>
      </div>

      {/* History List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Histórico Recente</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload} 
            disabled={transactions.length === 0}
            icon={<Download size={14} />}
            className="text-primary-600 hover:bg-primary-50"
          >
            Baixar Relatório
          </Button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Nenhuma movimentação ainda.</p>
        ) : (
          [...transactions].reverse().map(t => (
            <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{t.description}</p>
                  <p className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()} • {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                </span>
                <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
