import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import buildInfo from 'vite-plugin-build-info'

const pathSrc = path.resolve(__dirname, 'src')

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${pathSrc}/`,
    },
  },
  plugins: [react(), buildInfo({ enableMeta: false, enableGlobal: true })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@monaco-editor/react') || id.includes('node_modules/monaco-editor')) {
            return 'monaco'
          }
          if (id.includes('node_modules/@rjsf/')) {
            return 'forms'
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
})
