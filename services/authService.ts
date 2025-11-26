import { User } from '../types';

const USERS_STORAGE_KEY = 'sloth_users_db';
const SESSION_KEY = 'sloth_current_session';

// Simula a busca de dados de um servidor com um pequeno atraso.
const getUsersDB = async (): Promise<any[]> => {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simula latência de rede
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (e) {
    return [];
  }
};

const saveUsersDB = (users: any[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  // Tenta fazer login, agora de forma assíncrona
  login: async (email: string, password: string): Promise<User | null> => {
    const users = await getUsersDB();
    // NOTA: Em um app de produção, senhas NUNCA devem ser comparadas em texto puro.
    // Isso seria feito em um backend com senhas criptografadas (hash).
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const safeUser: User = { id: user.id, email: user.email, name: user.name };
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return safeUser;
    }
    return null;
  },

  // Registra um novo usuário, agora de forma assíncrona
  register: async (name: string, email: string, password: string): Promise<User | { error: string }> => {
    const users = await getUsersDB();
    
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

  // Verifica se já existe alguém logado, agora de forma assíncrona
  getCurrentUser: async (): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simula checagem de token
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  }
};