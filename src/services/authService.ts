
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile, // Added updateProfile
  User as FirebaseUser,
} from 'firebase/auth';
import { app } from '../firebaseConfig'; // Corrected import path
import { User } from '../../types';

const auth = getAuth(app);

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!,
        };
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error logging in:", error);
      return null;
    }
  },

  register: async (name: string, email: string, password: string): Promise<User | { error: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update user profile with the name
      await updateProfile(firebaseUser, { displayName: name });

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
      };
      return user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { error: 'Este e-mail já está cadastrado.' };
      }
      console.error("Error registering:", error);
      return { error: 'Ocorreu um erro ao se registrar.' };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  },

  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        unsubscribe();
        if (firebaseUser) {
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email!,
          };
          resolve(user);
        } else {
          resolve(null);
        }
      });
    });
  },
};
