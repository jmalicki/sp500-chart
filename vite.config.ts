import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Set BASE_PATH when deploying to GitHub Pages project sites, e.g. /sp500-chart/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
})
