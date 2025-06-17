import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server:{
    port: 6677,
    proxy:{
      '/api':{
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 如果后端api不是以/api开头，可以使用rewrite重写路径
        rewrite: (path)=>path.replace(/^\/api/, '')
      },
      // 添加静态资源代理
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
