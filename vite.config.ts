import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
        host: '0.0.0.0',
      },
      preview: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY),
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY),
        'process.env.DEEPSEEK_CHAT_MODEL': JSON.stringify(env.DEEPSEEK_CHAT_MODEL),
        'process.env.DEEPSEEK_REASONER_MODEL': JSON.stringify(env.DEEPSEEK_REASONER_MODEL),
        'process.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN),
        'process.env.MINERU_ID': JSON.stringify(env.MINERU_ID),
        'process.env.MINERU_KEY': JSON.stringify(env.MINERU_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
