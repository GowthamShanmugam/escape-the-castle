import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            setImmediate(() => {
              socket.removeAllListeners('error')
              socket.on('error', (err) => {
                if (['EPIPE', 'ECONNRESET', 'ECONNREFUSED'].includes(err?.code)) return
                console.error('[ws proxy]', err?.message ?? err)
              })
            })
          })
        },
      },
    },
  },
})
