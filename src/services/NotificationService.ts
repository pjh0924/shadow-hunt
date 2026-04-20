/**
 * NotificationService.ts
 * --------------------------------------------------------------
 * @capacitor/local-notifications 중앙 허브.
 *   - 최초 사용 시 권한 요청
 *   - 헌트존 진입 알림: 화면이 꺼져 있어도 보임 (Android 13+ POST_NOTIFICATIONS)
 *
 * 웹 dev 에선 Capacitor.getPlatform()==='web' → Notification API 폴백.
 */
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

let permChecked = false;
let permGranted = false;

async function ensurePermission(): Promise<boolean> {
  if (permChecked) return permGranted;
  permChecked = true;
  try {
    if (Capacitor.getPlatform() === 'web') {
      if (typeof Notification === 'undefined') return false;
      if (Notification.permission === 'granted') {
        permGranted = true;
        return true;
      }
      if (Notification.permission !== 'denied') {
        const r = await Notification.requestPermission();
        permGranted = r === 'granted';
        return permGranted;
      }
      return false;
    }
    const cur = await LocalNotifications.checkPermissions();
    if (cur.display === 'granted') {
      permGranted = true;
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    permGranted = req.display === 'granted';
    return permGranted;
  } catch {
    return false;
  }
}

export const NotificationService = {
  /** 권한을 선제적으로 요청 (앱 시작/사용자 제스처 후 호출). */
  async prime(): Promise<boolean> {
    return ensurePermission();
  },

  /** 헌트존 진입 알림. 중복 방지는 caller 책임. */
  async zoneEntered(title: string, body: string): Promise<void> {
    const ok = await ensurePermission();
    if (!ok) return;

    if (Capacitor.getPlatform() === 'web') {
      try {
        new Notification(title, { body, silent: false });
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title,
            body,
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      });
    } catch {
      /* ignore */
    }
  },
};
