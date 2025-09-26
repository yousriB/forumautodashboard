import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

export default defineConfig({
  server: {
    proxy: {
      // This will handle all routes and serve index.html for 404s
      '^/.*': {
        target: 'http://localhost:8080',
        bypass: (req, res, options) => {
          // Serve index.html for all routes
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      },
    },
  },
  preview: {
    proxy: {
      '^/.*': {
        target: 'http://localhost:8080',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
