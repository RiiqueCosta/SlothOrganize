import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import 'process' to ensure correct TypeScript typings for Node.js globals like process.cwd().
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Substitui apenas a string 'process.env.API_KEY' pelo valor real da chave
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});