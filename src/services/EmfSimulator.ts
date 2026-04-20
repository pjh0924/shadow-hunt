/**
 * EmfSimulator.ts
 * --------------------------------------------------------------
 * 0.0 ~ 5.0 EMF 값 스트림.
 *
 * 입력 3 가지를 합성:
 *   1. 베이스라인 노이즈 + 시간 따라 커지는 긴장도
 *   2. 외부 스파이크 (ML 검출 시 triggerSpike)
 *   3. **실제 Magnetometer** (Web Generic Sensor API) 의 baseline 편차
 *
 * Magnetometer 미지원 (Safari 등) 시 silent fallback → 1+2 만 동작.
 * Secure context (HTTPS / localhost / Capacitor file://) 필요.
 */

type Listener = (value: number) => void;

// Magnetometer 브라우저 API 타입 — lib.dom 에 없을 수 있어 최소 shape 정의
interface MagnetometerLike {
  addEventListener(type: 'reading', cb: () => void): void;
  addEventListener(type: 'error', cb: (e: Event) => void): void;
  start(): void;
  stop(): void;
  x: number | null;
  y: number | null;
  z: number | null;
}
interface MagnetometerCtor {
  new (opts?: { frequency?: number; referenceFrame?: string }): MagnetometerLike;
}

export class EmfSimulator {
  static readonly MAX_LEVEL = 5;
  /** μT 편차 → EMF 단위 변환 (5μT = 1단위). */
  private static readonly MU_T_PER_EMF_UNIT = 5;
  /** baseline EMA 알파 — 작을수록 환경 자기장 변화를 천천히 학습. */
  private static readonly BASELINE_ALPHA = 0.005;

  private _timer: number | null = null;
  private _listeners = new Set<Listener>();
  private _tension = 0;
  private _forcedHighFrames = 0;
  private _last = 0;

  private _mag: MagnetometerLike | null = null;
  private _sensorActive = false;
  private _sensorBaseline = 45;
  private _sensorMag = 45;

  get last() {
    return this._last;
  }
  /** 디버그/HUD 용 — 진짜 센서가 돌고 있는지 여부. */
  get sensorActive() {
    return this._sensorActive;
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** interval(ms) 간격으로 _tick 을 돌리며 리스너 알림. magnetometer 도 시도. */
  start(intervalMs = 120): void {
    if (this._timer !== null) return;
    this._timer = window.setInterval(() => this._tick(), intervalMs);
    this._attachMagnetometer();
  }

  stop(): void {
    if (this._timer !== null) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
    this._detachMagnetometer();
  }

  triggerSpike(durationFrames = 6): void {
    this._forcedHighFrames = Math.max(this._forcedHighFrames, durationFrames);
  }

  setTension(t: number): void {
    this._tension = Math.max(0, Math.min(1, t));
  }

  dispose(): void {
    this.stop();
    this._listeners.clear();
  }

  // --------------- Magnetometer ---------------
  private _attachMagnetometer() {
    const Ctor = (window as unknown as { Magnetometer?: MagnetometerCtor })
      .Magnetometer;
    if (!Ctor) return; // unsupported — simulation only
    try {
      const mag = new Ctor({ frequency: 10, referenceFrame: 'device' });
      mag.addEventListener('reading', () => this._onReading(mag));
      mag.addEventListener('error', () => this._detachMagnetometer());
      mag.start();
      this._mag = mag;
    } catch {
      // permissions policy block 등 — silent.
    }
  }

  private _detachMagnetometer() {
    try {
      this._mag?.stop();
    } catch {
      /* ignore */
    }
    this._mag = null;
    this._sensorActive = false;
  }

  private _onReading(mag: MagnetometerLike) {
    const x = mag.x ?? 0;
    const y = mag.y ?? 0;
    const z = mag.z ?? 0;
    this._sensorMag = Math.sqrt(x * x + y * y + z * z);
    if (!this._sensorActive) {
      this._sensorBaseline = this._sensorMag;
      this._sensorActive = true;
    } else {
      const a = EmfSimulator.BASELINE_ALPHA;
      this._sensorBaseline =
        this._sensorBaseline * (1 - a) + this._sensorMag * a;
    }
  }

  private _tick() {
    let value: number;
    if (this._forcedHighFrames > 0) {
      this._forcedHighFrames--;
      value = 4.6 + Math.random() * 0.4;
    } else {
      const noise = (Math.random() - 0.5) * (0.6 + this._tension * 1.2);
      const base = 0.4 + this._tension * 0.7;
      value = base + noise;

      if (this._sensorActive) {
        const dev = Math.abs(this._sensorMag - this._sensorBaseline);
        const contribution = Math.min(5, dev / EmfSimulator.MU_T_PER_EMF_UNIT);
        value += contribution;
      }

      const spikeProb = 0.04 + this._tension * 0.08;
      if (Math.random() < spikeProb) {
        value = 2.5 + Math.random() * 1.5;
      }
    }
    value = Math.max(0, Math.min(5, value));
    this._last = value;
    this._listeners.forEach((l) => l(value));
  }
}
