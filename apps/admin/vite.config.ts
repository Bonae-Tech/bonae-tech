import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { contentApiMockPlugin } from './vite.mockApi.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useMock = env.VITE_USE_MOCK === 'true';

  return {
    plugins: [react(), ...(useMock ? [contentApiMockPlugin()] : [])],
    define: {
      global: 'globalThis',
    },
    server: { port: 5173 },
  };
});
