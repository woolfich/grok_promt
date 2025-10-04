import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './grok_promt', // ✅ Относительный путь — работает всегда на GitHub Pages
});
