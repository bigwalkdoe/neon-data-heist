import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Relative base keeps the built bundle portable for itch.io / embed hosting.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
})
