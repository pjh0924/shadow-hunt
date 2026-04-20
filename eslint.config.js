import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    'dev-dist',
    'android',
    'ios',
    'public/mediapipe',
    '.gh-workflows-pending',
    'coverage',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // a11y — 스크린리더/키보드 네비 린트
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Shadow Hunt 커스텀 UI 가 버튼처럼 생긴 DOM 을 직접 쓰는 경우가 많음
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      // h1 에 role="button" 을 일부러 씀 (타이틀 겸 long-press 인터랙션)
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
      // _prefix 언더스코어 접두 파라미터는 의도적 미사용
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // React 19 의 새 규칙 — 외부 구독/초기 fetch 처럼 정당한 사용이 많아 warn 으로 완화
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
