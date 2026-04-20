#!/usr/bin/env node
/**
 * generate-sfx.mjs
 * --------------------------------------------------------------
 * ffmpeg lavfi 로 호러 SFX mp3 생성.
 *
 * 각 SFX 는 개별 ffmpeg 호출로 단순화. 명령 실패 시 로그 출력.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const out = join(root, 'public/sfx');
mkdirSync(out, { recursive: true });

const TMP = join(root, 'scratch/sfx-tmp');
mkdirSync(TMP, { recursive: true });

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

/** 단일 lavfi 입력으로 간단 톤 + 페이드 wav. */
function tone(file, { freq, dur, fadeOut = true, vol = 0.8 }) {
  const target = join(TMP, file);
  const fade = fadeOut ? `,afade=t=out:st=${(dur - 0.05).toFixed(3)}:d=0.05` : '';
  sh(
    `ffmpeg -hide_banner -loglevel error -y ` +
      `-f lavfi -i "sine=frequency=${freq}:duration=${dur}" ` +
      `-af "volume=${vol}${fade}" ` +
      `-ac 1 -ar 44100 "${target}"`
  );
  return target;
}

/** bandpass 필터링된 짧은 화이트 노이즈. */
function noise(file, { dur, bpf = null, vol = 0.3 }) {
  const target = join(TMP, file);
  const bpfFlt = bpf ? `,bandpass=f=${bpf}` : '';
  sh(
    `ffmpeg -hide_banner -loglevel error -y ` +
      `-f lavfi -i "anoisesrc=color=white:amplitude=${vol}:duration=${dur}" ` +
      `-af "volume=1${bpfFlt},afade=t=out:st=${Math.max(0, dur - 0.04).toFixed(3)}:d=0.04" ` +
      `-ac 1 -ar 44100 "${target}"`
  );
  return target;
}

/** 파일들을 amix 로 섞고 mp3 로. */
function mix(output, inputs) {
  const target = join(out, output);
  const ins = inputs.map((p) => `-i "${p}"`).join(' ');
  const n = inputs.length;
  sh(
    `ffmpeg -hide_banner -loglevel error -y ${ins} ` +
      `-filter_complex "amix=inputs=${n}:duration=longest:normalize=0" ` +
      `-ac 1 -ar 44100 -c:a libmp3lame -b:a 96k "${target}"`
  );
  console.log(`✓ ${output}`);
}

// ---- 1) enter — 저음 쿵 + 하강 톤 ----
const e1 = tone('e_t1.wav', { freq: 220, dur: 0.4, vol: 0.8 });
const e2 = tone('e_t2.wav', { freq: 80, dur: 0.45, vol: 0.5 });
const e3 = tone('e_t3.wav', { freq: 55, dur: 0.5, vol: 0.3 });
mix('enter.mp3', [e1, e2, e3]);

// ---- 2) exit — 상승 + 노이즈 꼬리 ----
const x1 = tone('x_t1.wav', { freq: 120, dur: 0.3, vol: 0.4 });
const x2 = noise('x_n1.wav', { dur: 0.25, bpf: 800, vol: 0.15 });
mix('exit.mp3', [x1, x2]);

// ---- 3) first_sighting — 심장박동 3회 + sub drone ----
// 각 박동은 padded 로 딜레이 후 합성. 간단화: 세 개 톤을 adelay 로 시간차 줌.
function delayed(file, src, ms) {
  const target = join(TMP, file);
  sh(
    `ffmpeg -hide_banner -loglevel error -y -i "${src}" ` +
      `-af "adelay=${ms}|${ms},apad=whole_dur=0.8" ` +
      `-ac 1 -ar 44100 "${target}"`
  );
  return target;
}
const b0 = tone('fs_b.wav', { freq: 70, dur: 0.15, vol: 0.85 });
const bb1 = delayed('fs_b1.wav', b0, 0);
const bb2 = delayed('fs_b2.wav', b0, 180);
const bb3 = delayed('fs_b3.wav', b0, 360);
const drone = tone('fs_d.wav', { freq: 45, dur: 0.7, vol: 0.25 });
mix('first_sighting.mp3', [bb1, bb2, bb3, drone]);

// ---- 4) shutter — 짧은 click ----
const s1 = noise('s_c1.wav', { dur: 0.04, bpf: null, vol: 0.6 });
// 고역 강조
sh(
  `ffmpeg -hide_banner -loglevel error -y -i "${s1}" -af "highpass=f=2000" ` +
    `-ac 1 -ar 44100 "${join(TMP, 's_c1_hp.wav')}"`
);
const s1hp = join(TMP, 's_c1_hp.wav');
const s2 = noise('s_c2.wav', { dur: 0.06, bpf: 1500, vol: 0.2 });
const s2d = delayed('s_c2d.wav', s2, 80);
mix('shutter.mp3', [s1hp, s2d]);

// ---- 5) emf_spike — 상승 zap + 노이즈 버스트 ----
// sine 대신 sawtooth 는 lavfi 에 없으므로 그냥 고주파 sine + 노이즈
const z1 = tone('z_t.wav', { freq: 900, dur: 0.15, vol: 0.45 });
const z2 = noise('z_n.wav', { dur: 0.1, bpf: 2500, vol: 0.3 });
mix('emf_spike.mp3', [z1, z2]);

// cleanup
rmSync(TMP, { recursive: true, force: true });

console.log('\nSFX 생성 완료 → public/sfx/');
