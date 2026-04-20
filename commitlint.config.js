/**
 * Conventional Commits 기반 규칙.
 *   type(scope): subject
 *   예) feat(camera): add first-sighting pulse
 *       fix(map): hunt zone hit-test off-by-one
 *       docs, chore, refactor, perf, test, build, ci ...
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0], // 한국어 subject 허용
    'header-max-length': [2, 'always', 100],
  },
};
