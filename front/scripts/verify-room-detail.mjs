/**
 * Room detail inline check-in smoke test.
 * Run: node scripts/verify-room-detail.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.APP_URL || 'http://localhost:5173';

async function loginAs(page, profileName) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole('button', { name: `${profileName}으로 시작` }).click();
  await page.waitForURL('**/home');
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await loginAs(page, '김윤기');

  await page.goto(`${BASE_URL}/rooms/1`);
  await page.waitForSelector('.room-header__title');

  await page.waitForSelector('.footer-action-bar');
  await page.waitForSelector('.feed-list__oldest-hint');

  const fab = page.getByRole('button', { name: '인증하기' });
  await fab.click();
  await page.waitForSelector('.check-in-footer-layer__menu--open');

  await page.getByRole('button', { name: '녹음 인증' }).click();
  await page.waitForSelector('.inline-voice-recorder');
  if ((await page.locator('.footer-action-bar').count()) > 0) {
    throw new Error('Footer should be hidden during voice recording');
  }

  await page.getByRole('button', { name: '취소' }).click();
  await page.waitForSelector('.inline-voice-recorder', { state: 'hidden' });
  await page.waitForSelector('.footer-action-bar');

  await fab.click();
  await page.getByRole('button', { name: '계수기 인증' }).click();
  await page.waitForSelector('.inline-counter-recorder');

  const plusBtn = page.getByRole('button', { name: '횟수 늘리기' });
  await plusBtn.click();
  await plusBtn.click();
  await page.getByRole('button', { name: '완료하기' }).click();
  await page.waitForSelector('.inline-counter-recorder', { state: 'hidden' });
  await page.waitForSelector('.footer-action-bar');

  console.log('✓ Room detail footer + inline check-in checks passed');
  await browser.close();
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
