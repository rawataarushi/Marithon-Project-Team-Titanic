import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",                // listen on all addresses, required for Render
    port: process.env.PORT || 5173, // use Render's assigned port, fallback to 5173 locally
  },
})
