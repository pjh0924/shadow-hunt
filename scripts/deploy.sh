#!/usr/bin/env bash
# ==============================================================
# deploy.sh — gh-pages 브랜치로 웹 PWA 수동 배포
# --------------------------------------------------------------
# 용도: GitHub Actions workflow 없이 로컬에서 최신 dist/ 를
# GitHub Pages 에 반영.
#
#   ./scripts/deploy.sh
# ==============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "✗ working tree 에 변경 사항이 있습니다. 먼저 커밋/스태시 해주세요."
  exit 1
fi

ORIG_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "· 현 브랜치: $ORIG_BRANCH"

echo "· Vite build..."
npm run build >/dev/null

if git show-ref --verify --quiet refs/heads/gh-pages; then
  git checkout gh-pages
  git rm -rqf . >/dev/null || true
else
  git checkout --orphan gh-pages
  git reset --hard >/dev/null
fi

cp -r dist/. .
touch .nojekyll
cp index.html 404.html 2>/dev/null || true

git add -A >/dev/null
if git diff --cached --quiet; then
  echo "· 변경 없음 — skip commit."
else
  SHORT_SHA="$(git rev-parse --short "$ORIG_BRANCH")"
  git -c user.email=dev@shadowhunt.local \
      -c user.name="Shadow Hunt Deploy" \
      commit -m "deploy: gh-pages from $ORIG_BRANCH@$SHORT_SHA" >/dev/null
  git push origin gh-pages
fi

git checkout "$ORIG_BRANCH" >/dev/null 2>&1
echo "✓ 배포 완료 → https://pjh0924.github.io/shadow-hunt/"
echo "  (반영까지 ~1분 소요)"
