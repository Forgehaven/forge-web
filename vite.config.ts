import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SECTION_TITLES } from './src/config/sections'

function headScripts(): import('vite').Plugin {
  const titleMap = SECTION_TITLES.map(([k, v]) => `'${k}':'${v}'`).join(',')
  return {
    name: 'head-scripts',
    transformIndexHtml: () => [
      {
        tag: 'script',
        injectTo: 'head-prepend',
        children: `(function(){var t={${titleMap}},r=sessionStorage.getItem('ghp-redirect');if(r){sessionStorage.removeItem('ghp-redirect');history.replaceState(null,'',r);}var p=location.pathname;for(var k in t){if(p.startsWith(k)){document.title=t[k];break;}}})()`,
      },
    ],
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), headScripts()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
