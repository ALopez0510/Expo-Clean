import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { pliegoApiPlugin } from './server/pliegoApi.js';

export default defineConfig(({ mode }) => {
  // Carga .env.local (incluye variables sin prefijo VITE_, que NO se exponen al navegador)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), pliegoApiPlugin(env)],
    server: {
      port: 5173,
      open: false
    }
  };
});
