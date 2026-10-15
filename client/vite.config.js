import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Check if local node_modules exists, otherwise fallback to netrish node_modules
const fallbackModules = 'C:/Users/india/Downloads/netrish/node_modules';
const localModules = path.resolve(__dirname, '../node_modules');
const clientModules = path.resolve(__dirname, './node_modules');

let targetModules = fallbackModules;
if (fs.existsSync(clientModules)) {
  targetModules = clientModules;
} else if (fs.existsSync(localModules)) {
  targetModules = localModules;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react/jsx-dev-runtime': path.join(targetModules, 'react/jsx-dev-runtime.js'),
      'react/jsx-runtime': path.join(targetModules, 'react/jsx-runtime.js'),
      'react': path.join(targetModules, 'react'),
      'react-dom/client': path.join(targetModules, 'react-dom/client.js'),
      'react-dom': path.join(targetModules, 'react-dom')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
