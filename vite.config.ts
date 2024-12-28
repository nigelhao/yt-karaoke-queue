import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          aws: ['@aws-sdk/client-dynamodb', '@aws-sdk/client-secrets-manager'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@aws-sdk/client-dynamodb', '@aws-sdk/client-secrets-manager'],
  },
  define: {
    // Ensure AWS SDK works in browser
    'global': 'globalThis',
  },
  // Environment variables that should be available to client
  envPrefix: ['VITE_'],
});
