import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SECTION_TITLES } from './src/config/sections'

function titleScript(): import('vite').Plugin {
  return {
    name: 'inject-title-script',
    transformIndexHtml() {
      const map = SECTION_TITLES.map(([k, v]) => `'${k}':'${v}'`).join(',')
      return [{
        tag: 'script',
        injectTo: 'head-prepend',
        children: `(function(){var t={${map}},p=location.pathname;for(var k in t){if(p.startsWith(k)){document.title=t[k];break}}})()`,
      }]
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), titleScript()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
