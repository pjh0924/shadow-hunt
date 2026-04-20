import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const sizes = [192, 512];
for (const s of sizes) {
  const out = join(root, `public/pwa-${s}.png`);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(join(root, 'resources/source/icon.svg'), { density: 300 })
    .resize(s, s, { fit: 'cover' })
    .flatten({ background: '#000' })
    .png()
    .toFile(out);
  console.log(`✓ ${out}`);
}
// maskable 아이콘: safe area 고려한 약 80% scaled
{
  const s = 512;
  const out = join(root, `public/pwa-maskable-${s}.png`);
  await sharp(join(root, 'resources/source/icon.svg'), { density: 300 })
    .resize(Math.round(s*0.8), Math.round(s*0.8), { fit: 'cover' })
    .extend({
      top: Math.round(s*0.1), bottom: Math.round(s*0.1),
      left: Math.round(s*0.1), right: Math.round(s*0.1),
      background: '#000',
    })
    .flatten({ background: '#000' })
    .png()
    .toFile(out);
  console.log(`✓ ${out}`);
}
// favicon.svg 는 원본 그대로 복사 (Vite 가 알아서 처리)
