/**
 * useCompass.ts
 * --------------------------------------------------------------
 * `deviceorientation` 이벤트 기반 나침반 헤딩 (0~360°).
 *
 *  - iOS Safari: DeviceOrientationEvent.requestPermission() 필요 (user gesture).
 *    권한 받으면 `webkitCompassHeading` 이 0=북 기준으로 바로 옴.
 *  - Android Chrome / Capacitor: `alpha` 를 쓰되, 북 기준은 360 - alpha.
 *  - 미지원/권한 거부 시 heading=null → 사용자 마커 화살표 숨김.
 */
import { useEffect, useState } from 'react';

// iOS webkit 전용 프로퍼티 — DeviceOrientationEvent 확장
interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

// Safari의 requestPermission 시그니처
interface RequestPermissionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [supported, setSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      return;
    }
    setSupported(true);

    const handler = (e: DeviceOrientationEvent) => {
      const ios = (e as IOSDeviceOrientationEvent).webkitCompassHeading;
      if (typeof ios === 'number' && !Number.isNaN(ios)) {
        setHeading(ios);
        return;
      }
      if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        // Chrome Android: alpha 0~360, 반시계 회전.
        // 화면을 들고 앞을 본 방향이 어떤 값이 되느냐가 디바이스마다 달라 완벽하진 않지만
        // 대략적인 compass heading 근사.
        setHeading((360 - e.alpha) % 360);
      }
    };

    // iOS 13+ 권한 요청 — tap 시에만 호출 가능
    const ctor = (window as unknown as { DeviceOrientationEvent?: RequestPermissionEvent })
      .DeviceOrientationEvent;
    if (ctor?.requestPermission) {
      // UI가 직접 tap 시 호출하는 게 원칙. 여기선 바로 시도.
      ctor.requestPermission().then(
        (state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handler, true);
          }
        },
        () => {
          /* user denied */
        }
      );
    } else {
      window.addEventListener('deviceorientation', handler, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  return { heading, supported };
}
