import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {allowedHosts: ['api.z-movies-powerd-by-zaneflix-m9wx.vercel.app']},
  plugins: [tailwindcss(),]
});
