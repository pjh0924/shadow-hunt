import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      // 스토리는 일부 파일만 커버 (순수 서비스/유틸). UI/네이티브 의존은 제외.
      include: [
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        'src/models/**/*.ts',
      ],
      exclude: [
        // 네이티브/브라우저 API 의존 — 유닛 테스트 커버 어려움
        'src/services/location/RealLocationProvider.ts',
        'src/services/location/BackgroundLocationProvider.ts',
        'src/services/location/LocationPermissionHelper.ts',
        'src/services/FaceDetectionService.ts',
        'src/services/NotificationService.ts',
        'src/services/FeedbackService.ts',
        'src/services/CodexShare.ts',
        'src/services/GhostCodexRepository.ts',
        'src/services/SoundService.ts', // Web Audio 의존
        'src/services/PhotoCompositor.ts', // Canvas API 의존
        'src/services/RemoteGhostSource.ts', // interface + no-op
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 60,
      },
    },
  },
});
