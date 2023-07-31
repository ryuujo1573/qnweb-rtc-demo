import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fullReload from 'vite-plugin-full-reload'
import { visualizer } from 'rollup-plugin-visualizer'
import fs from 'node:fs'
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
      plugins: [
        [
          '@swc/plugin-transform-imports',
          {
            '@mui/icons-material': {
              transform: '@mui/icons-material/{{ member }}',
              preventFullImport: true,
            },
          },
        ],
      ],
    }),
    fullReload(['src/pages/room.tsx']),
    visualizer(),
    {
      name: 'singleHMR',
      handleHotUpdate({ modules }) {
        modules.map((m) => {
          m.importedModules = new Set()
          m.importers = new Set()
        })

        return modules
      },
    },
    // basicSsl(),
  ],
  resolve: {
    alias: {
      'hls.js': 'hls.js/dist/hls.min.js',
      '@mui/material/base': '@mui/material',
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: {
      cert: fs.readFileSync('cert/server.crt'),
      key: fs.readFileSync('cert/server.key'),
    },
  },
  preview: {
    host: true,
    port: 60000,
    strictPort: true,
    https: {
      cert: fs.readFileSync('localme.crt'),
      key: fs.readFileSync('localme.key'),
    },
  },
})
