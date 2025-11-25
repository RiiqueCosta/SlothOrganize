
export enum Priority {
  Low = 'Baixa',
  Medium = 'Média',
  High = 'Alta'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
  completedAt?: number; // Added to track history
  dueDate?: number; // Scheduled date
  subtasks: Subtask[];
  category?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AIEnhancementResponse {
  description: string;
  priority: string; // Will map to enum
  subtasks: string[];
  category: string;
}

export type FilterType = 'all' | 'active' | 'completed' | 'scheduled';
export type ViewType = 'tasks' | 'calendar' | 'focus';