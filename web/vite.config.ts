import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'web',
  plugins: [react(), {
    name: 'app-routes',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (/^\/(crm(?:\/|\?|$)|join(?:\?|$)|login(?:\?|$)|report(?:\?|$)|body-analysis(?:\?|$))/.test(req.url || '') && req.headers.accept?.includes('text/html')) req.url = '/app.html';
        next();
      });
    },
  }],
  resolve: {
    alias: {
      '@web': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: { input: { landing: path.resolve(__dirname, 'index.html'), app: path.resolve(__dirname, 'app.html') } },
    outDir: '../dist/web',
    emptyOutDir: true,
  },
});
