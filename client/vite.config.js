import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy dla żądań API do serwera backendowego podczas developmentu
    // Zakładamy, że serwer Express działa na porcie 5500 (domyślny z Twojego server.js)
    proxy: {
      '/api': {
        target: 'http://localhost:5500', // Zmień, jeśli Twój serwer Express działa na innym porcie
        changeOrigin: true,
      },
      '/auth': { // Proxy dla ścieżek autoryzacji
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
      // Możesz dodać więcej ścieżek do proxy, jeśli są potrzebne
    }
  },
  build: {
    outDir: 'dist', // Katalog wyjściowy dla zbudowanej aplikacji
    assetsDir: 'assets', // Katalog dla zasobów statycznych wewnątrz outDir
  }
})
