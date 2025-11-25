import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Substitui 'process.env.API_KEY' pelo valor real da chave
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Define 'process.env' como objeto vazio para evitar crash se o código acessar outras propriedades
      'process.env': {}
    }
  };
});