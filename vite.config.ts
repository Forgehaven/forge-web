import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { SECTION_TITLES } from './src/config/sections'
import { readFileSync, copyFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const FFMPEG_DIR = resolve(import.meta.dirname, 'node_modules/@ffmpeg/core/dist/umd')

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

function ffmpegCorePlugin(): import('vite').Plugin {
  return {
    name: 'ffmpeg-core-module',
    configureServer(server) {
      server.middlewares.use('/ffmpeg/ffmpeg-core.js', (_req, res) => {
        const code = readFileSync(resolve(FFMPEG_DIR, 'ffmpeg-core.js'), 'utf-8')
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(code + '\nexport default createFFmpegCore\n')
      })
      server.middlewares.use('/ffmpeg/ffmpeg-core.wasm', (_req, res) => {
        const data = readFileSync(resolve(FFMPEG_DIR, 'ffmpeg-core.wasm'))
        res.setHeader('Content-Type', 'application/wasm')
        res.end(data)
      })
    },
    writeBundle() {
      const out = resolve(import.meta.dirname, 'dist/ffmpeg')
      mkdirSync(out, { recursive: true })
      const js = readFileSync(resolve(FFMPEG_DIR, 'ffmpeg-core.js'), 'utf-8')
      writeFileSync(resolve(out, 'ffmpeg-core.js'), js + '\nexport default createFFmpegCore\n')
      copyFileSync(resolve(FFMPEG_DIR, 'ffmpeg-core.wasm'), resolve(out, 'ffmpeg-core.wasm'))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), headScripts(), ffmpegCorePlugin()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
