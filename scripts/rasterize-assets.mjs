#!/usr/bin/env node
/**
 * rasterize-assets.mjs
 * --------------------------------------------------------------
 * resources/source/*.svg → resources/*.png (Sharp 로 렌더).
 * Capacitor Assets 가 PNG 만 받으므로 한 번 래스터라이즈.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';

async function render(svgPath, outPath, size, { flatten = true } = {}) {
  const out = join(root, outPath);
  mkdirSync(dirname(out), { recursive: true });
  let pipeline = sharp(join(root, svgPath), { density: 300 }).resize(
    size,
    size,
    { fit: 'cover' }
  );
  if (flatten) {
    pipeline = pipeline.flatten({ background: '#000000' });
  }
  await pipeline.png().toFile(out);
  console.log(`✓ ${outPath} (${size}x${size})`);
}

// icon: 1024 square (opaque) + icon-only with transparency for adaptive
// Capacitor Assets 는 기본 icon.png 를 쓰되, adaptive 용 foreground 도
// 자동 생성해줌. 가장 간단한 경로: icon.png + icon-foreground.png (투명).
await render(
  'resources/source/icon.svg',
  'resources/icon.png',
  1024
);
await render(
  'resources/source/icon.svg',
  'resources/icon-foreground.png',
  1024,
  { flatten: false }
);

// splash: 2732 square
await render(
  'resources/source/splash.svg',
  'resources/splash.png',
  2732
);
await render(
  'resources/source/splash.svg',
  'resources/splash-dark.png',
  2732
);

console.log('done.');
