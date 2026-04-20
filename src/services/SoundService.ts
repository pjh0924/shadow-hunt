/**
 * SoundService.ts
 * --------------------------------------------------------------
 * Web Audio API 로 호러 SFX 를 프로시저럴 생성.
 * mp3 자산 없이도 즉시 동작.
 *
 * 추가로 `public/sfx/<key>.mp3` 가 존재하면 그 파일을 우선 사용
 * (사용자가 자산 덮어쓰기 가능). 자산 fetch 실패 시 자동으로 프로시저럴로 폴백.
 *
 * 이벤트 키:
 *   enter            — 헌트존 진입: 짧은 저음 쿵 (톤 하강)
 *   exit             — 헌트존 이탈: 바람 빠지는 느낌 (톤 상승 후 페이드)
 *   first_sighting   — 첫 발견: heartbeat x3 + subharmonic
 *   shutter          — 촬영: 빠른 click + 짧은 reverb
 *   emf_spike        — EMF 4+ 크로싱: zap 버스트
 */

type Key = 'enter' | 'exit' | 'first_sighting' | 'shutter' | 'emf_spike';

// 자산 우선, 실패 시 프로시저럴 — 파일 경로는 Vite base 고려.
const ASSET_BASE = (import.meta.env.BASE_URL ?? './').replace(/\/$/, '');
const ASSET_URLS: Record<Key, string> = {
  enter: `${ASSET_BASE}/sfx/enter.mp3`,
  exit: `${ASSET_BASE}/sfx/exit.mp3`,
  first_sighting: `${ASSET_BASE}/sfx/first_sighting.mp3`,
  shutter: `${ASSET_BASE}/sfx/shutter.mp3`,
  emf_spike: `${ASSET_BASE}/sfx/emf_spike.mp3`,
};

/** 자산 존재 여부 캐시 (HEAD 체크 한 번). */
const assetAvailability = new Map<Key, boolean>();
const assetCache = new Map<Key, HTMLAudioElement>();
let ctx: AudioContext | null = null;
let unlocked = false;
let masterGain = 0.6;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

async function hasAsset(key: Key): Promise<boolean> {
  const cached = assetAvailability.get(key);
  if (cached !== undefined) return cached;
  try {
    const r = await fetch(ASSET_URLS[key], { method: 'HEAD' });
    const ok = r.ok;
    assetAvailability.set(key, ok);
    return ok;
  } catch {
    assetAvailability.set(key, false);
    return false;
  }
}

async function playAsset(key: Key): Promise<boolean> {
  if (!(await hasAsset(key))) return false;
  let a = assetCache.get(key);
  if (!a) {
    a = new Audio(ASSET_URLS[key]);
    a.preload = 'auto';
    assetCache.set(key, a);
  }
  try {
    a.currentTime = 0;
    a.volume = masterGain;
    await a.play();
    return true;
  } catch {
    return false;
  }
}

// ---------------- 프로시저럴 제너레이터 ----------------

function envelope(
  c: AudioContext,
  gain: GainNode,
  attack: number,
  hold: number,
  release: number,
  peak = 1
) {
  const now = c.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + attack);
  gain.gain.setValueAtTime(peak, now + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + hold + release);
  return now + attack + hold + release + 0.02;
}

interface ToneOpts {
  freq?: number;
  freqEnd?: number;
  type?: OscillatorType;
  attack?: number;
  hold?: number;
  release?: number;
  peak?: number;
}

function tone(c: AudioContext, out: AudioNode, opts: ToneOpts) {
  const {
    freq = 440,
    freqEnd,
    type = 'sine',
    attack = 0.005,
    hold = 0.08,
    release = 0.15,
    peak = 0.6,
  } = opts;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, freqEnd),
      c.currentTime + attack + hold + release
    );
  }
  osc.connect(g).connect(out);
  const stopAt = envelope(c, g, attack, hold, release, peak);
  osc.start();
  osc.stop(stopAt);
}

function noiseBurst(
  c: AudioContext,
  out: AudioNode,
  {
    duration = 0.12,
    peak = 0.35,
    bandpass,
  }: { duration?: number; peak?: number; bandpass?: number }
) {
  const bufSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  let chain: AudioNode = g;
  if (bandpass !== undefined) {
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = bandpass;
    filter.Q.value = 8;
    src.connect(filter);
    filter.connect(g);
    chain = g;
  } else {
    src.connect(g);
  }
  chain.connect(out);
  envelope(c, g, 0.002, Math.max(0, duration - 0.04), 0.04, peak);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
}

function playProcedural(key: Key): void {
  const c = getCtx();
  if (!c) return;
  // 마스터 게인
  const master = c.createGain();
  master.gain.value = masterGain;
  master.connect(c.destination);

  switch (key) {
    case 'enter': {
      // 저음 쿵 + 톤 하강
      tone(c, master, { freq: 220, freqEnd: 80, type: 'sine', attack: 0.005, hold: 0.02, release: 0.35, peak: 0.7 });
      tone(c, master, { freq: 55, freqEnd: 30, type: 'sawtooth', attack: 0.01, hold: 0.02, release: 0.4, peak: 0.2 });
      break;
    }
    case 'exit': {
      tone(c, master, { freq: 120, freqEnd: 240, type: 'sine', attack: 0.02, hold: 0.05, release: 0.2, peak: 0.3 });
      noiseBurst(c, master, { duration: 0.2, peak: 0.15, bandpass: 800 });
      break;
    }
    case 'first_sighting': {
      // heartbeat 3연속 + sub-bass drone
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          tone(c, master, { freq: 70, freqEnd: 35, type: 'triangle', attack: 0.002, hold: 0.05, release: 0.18, peak: 0.8 });
          tone(c, master, { freq: 140, freqEnd: 90, type: 'sine', attack: 0.002, hold: 0.02, release: 0.12, peak: 0.3 });
        }, i * 180);
      }
      // 지속 low drone
      tone(c, master, { freq: 45, type: 'sawtooth', attack: 0.05, hold: 0.3, release: 0.4, peak: 0.15 });
      break;
    }
    case 'shutter': {
      // click + 약한 echo
      noiseBurst(c, master, { duration: 0.03, peak: 0.6, bandpass: 3000 });
      setTimeout(() => noiseBurst(c, master, { duration: 0.04, peak: 0.2, bandpass: 2000 }), 80);
      break;
    }
    case 'emf_spike': {
      // zap — 상승 sawtooth + 고주파 버스트
      tone(c, master, { freq: 300, freqEnd: 1500, type: 'sawtooth', attack: 0.002, hold: 0.02, release: 0.12, peak: 0.4 });
      noiseBurst(c, master, { duration: 0.08, peak: 0.25, bandpass: 2500 });
      break;
    }
  }
}

export const SoundService = {
  /** 첫 사용자 제스처에서 호출 — 모바일 자동재생 정책 해제. */
  unlock(): void {
    if (unlocked) return;
    unlocked = true;
    const c = getCtx();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {});
    }
  },

  /** 메인 볼륨 0~1. */
  setMasterGain(v: number): void {
    masterGain = Math.max(0, Math.min(1, v));
  },

  /** fire-and-forget. 자산 우선, 실패 시 프로시저럴. */
  play(key: Key): void {
    // 사용자 제스처 전이면 WebAudio 가 suspended 상태 → 무음. silent.
    playAsset(key).then((played) => {
      if (!played) playProcedural(key);
    });
  },
};
