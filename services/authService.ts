import { User } from '../types';

const USERS_STORAGE_KEY = 'sloth_users_db';
const SESSION_KEY = 'sloth_current_session';

// Simula um banco de dados de usuários buscando do localStorage
const getUsersDB = (): any[] => {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (e) {
    return [];
  }
};

// Salva o array de usuários de volta no localStorage
const saveUsersDB = (users: any[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  // Tenta fazer login verificando email e senha no "banco"
  login: (email: string, password: string): User | null => {
    const users = getUsersDB();
    // NOTA: Em um app de produção, senhas NUNCA devem ser comparadas em texto puro.
    // Usaríamos um backend com hash de senhas (ex: bcrypt).
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const safeUser: User = { id: user.id, email: user.email, name: user.name };
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return safeUser;
    }
    return null;
  },

  // Registra um novo usuário se o email não existir
  register: (name: string, email: string, password: string): User | { error: string } => {
    const users = getUsersDB();
    
    if (users.some(u => u.email === email)) {
      return { error: 'Este e-mail já está cadastrado.' };
    }

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password // NOTA: Em produção, NUNCA salvar senhas em texto puro.
    };

    users.push(newUser);
    saveUsersDB(users);

    const safeUser: User = { id: newUser.id, email: newUser.email, name: newUser.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  // Encerra a sessão
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Verifica se já existe alguém logado ao abrir o app
  getCurrentUser: (): User | null => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }
};
