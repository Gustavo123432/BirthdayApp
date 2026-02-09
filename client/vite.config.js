import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: ['aniversarios.epvc2.local'],
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    preview: {
        port: 5173,
        host: true,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
})
