import { defineConfig } from 'vite';

// Static single-page build. Relative base so the built files also work when opened from any path.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
