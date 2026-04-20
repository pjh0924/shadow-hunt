import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 번들 시각화 — ANALYZE=1 시에만 활성, dist/stats.html 생성.
    process.env.ANALYZE === '1' &&
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'mediapipe/*.wasm', 'mediapipe/*.js'],
      manifest: {
        name: 'Shadow Hunt',
        short_name: 'ShadowHunt',
        description:
          '호러 테마 포켓몬-GO 스타일. 지도 위 고스트 스팟을 찾아 AI 얼굴 검출로 형상을 포착합니다.',
        lang: 'ko',
        theme_color: '#0a0d0a',
        background_color: '#0a0d0a',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['games', 'entertainment'],
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // MediaPipe WASM / 모델 / 타일은 큼. 넉넉히 허용.
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm,json}'],
        runtimeCaching: [
          {
            // CartoDB 다크 맵 타일 — 한번 본 영역은 캐시 사용
            urlPattern: /https:\/\/\w+\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google storage 의 ML 모델
            urlPattern: /https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-models',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  // Capacitor 가 dist/ 를 그대로 native 앱에 패키징.
  // 절대경로 자산이 file:// 환경에서 깨지지 않도록 base 는 './'.
  base: './',
});
