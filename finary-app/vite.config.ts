import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Déployé sur GitHub Pages sous https://bulojs.github.io/Simu-SCI/
// -> les assets doivent être servis depuis le sous-chemin /Simu-SCI/.
// https://vite.dev/config/
export default defineConfig({
  base: '/Simu-SCI/',
  plugins: [react()],
});
