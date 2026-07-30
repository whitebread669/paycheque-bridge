import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // docs/ is a minified production bundle, not app source — leave it alone.
  server: {
    fs: {
      deny: ['**/docs/**'],
    },
  },
  test: {
    globals: true,
  },
})
