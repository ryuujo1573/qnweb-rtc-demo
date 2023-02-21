import { defineConfig } from 'vite'
import React from '@vitejs/plugin-react-swc'
import FullReload from 'vite-plugin-full-reload'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    React({
      tsDecorators: true,
    }),
    FullReload(['src/pages/room.tsx']),
  ],
})
