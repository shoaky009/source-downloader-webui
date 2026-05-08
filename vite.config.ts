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
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          monaco: ['@monaco-editor/react'],
          forms: ['@rjsf/core', '@rjsf/utils', '@rjsf/validator-ajv8'],
        },
      },
    },
  },
})
