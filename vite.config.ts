import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fullReload from 'vite-plugin-full-reload'
import { visualizer } from 'rollup-plugin-visualizer'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          qnsdk: ['qnweb-rtc'],
        },
      },
    },
  },
  plugins: [
    react({
      tsDecorators: true,
    }),
    fullReload(['src/pages/room.tsx']),
    visualizer(),
    // basicSsl(),
  ],
  resolve: {
    alias: {
      'hls.js': 'hls.js/dist/hls.min.js',
    },
  },
  server: {
    host: '0.0.0.0',
    // https: true,
  },
})
