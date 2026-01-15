import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const proxyConfig = env.VITE_API_URL ? {
    '/api': {
      target: env.VITE_API_URL,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  } : undefined

  return {
    plugins: [react()],
    server: {
      proxy: proxyConfig
    }
  }
})
