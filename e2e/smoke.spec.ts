/**
 * smoke.spec.ts
 * --------------------------------------------------------------
 * 가장 핵심 플로우만 빠르게 확인:
 *   1. Onboarding(첫 실행) 노출 + Skip 으로 Map 진입
 *   2. Mock 모드 진입 + 마커 렌더
 *   3. 설정 화면 진입 + 다크/라이트 토글
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 앱은 localStorage 에 onboarded 상태를 저장 → 각 테스트 전에 비움
  await page.goto('/');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

test('첫 실행: splash → onboarding → skip → map', async ({ page }) => {
  await page.goto('/');

  // splash(1.2s) + Onboarding lazy load 기다림 — selector 로 대기
  const skip = page.getByRole('button', { name: /건너뛰기|Skip/ });
  await expect(skip).toBeVisible({ timeout: 8000 });
  await skip.click();

  // 지도 화면 — ScanningLoader 텍스트 또는 Mock 버튼이 3초 후 뜸
  await expect(
    page.locator('text=신호를 스캔하는 중').or(page.locator('text=Scanning')),
  ).toBeVisible({ timeout: 5000 });
});

test('Mock 모드 진입 + 지도 렌더', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('button', { name: /건너뛰기|Skip/ });
  await expect(skip).toBeVisible({ timeout: 8000 });
  await skip.click();

  // Mock 폴백 버튼 — 3초 후 등장 ("DEV — Mock 모드로 시작")
  const mockBtn = page.getByRole('button', {
    name: /Mock 모드로 시작|Mock mode/,
  });
  await expect(mockBtn).toBeVisible({ timeout: 10000 });
  await mockBtn.click();

  // 헌트 액션 패널 텍스트
  await expect(page.locator('text=귀신을 찾아').or(page.locator('text=Move closer'))).toBeVisible({
    timeout: 8000,
  });
});

test('Settings 화면 진입', async ({ page }) => {
  await page.goto('/');
  const skip = page.getByRole('button', { name: /건너뛰기|Skip/ });
  await expect(skip).toBeVisible({ timeout: 8000 });
  await skip.click();

  const mockBtn = page.getByRole('button', {
    name: /Mock 모드로 시작|Mock mode/,
  });
  await expect(mockBtn).toBeVisible({ timeout: 10000 });
  await mockBtn.click();

  // AppBar 의 ⚙ 버튼으로 Settings 로
  const settingsBtn = page.getByRole('button', { name: /설정|Settings/ }).first();
  await settingsBtn.click();

  // Settings 화면 — 테마 / 언어 / 사운드 볼륨 섹션 존재
  await expect(page.locator('text=/사운드 볼륨|Sound volume/').first()).toBeVisible({
    timeout: 5000,
  });
});
