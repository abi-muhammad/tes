import { defineConfig } from 'vite';

// Konfigurasi Vite dengan base './' agar seluruh path aset (JS, CSS, manifest, ikon)
// bersifat relatif dan otomatis kompatibel di root domain maupun subpath repository
// GitHub Pages (misalnya https://username.github.io/kejaran-pak-wahid/).
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 800
  },
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  }
});
