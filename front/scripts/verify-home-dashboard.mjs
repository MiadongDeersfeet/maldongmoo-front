/**
 * Home dashboard smoke test.
 * Run: node scripts/verify-home-dashboard.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.APP_URL || 'http://localhost:5173';

async function loginAsTestAccount(page, label) {
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('button', { name: label }).click();
  await page.waitForURL('**/home');
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(BASE_URL);
  await page.evaluate(() => localStorage.clear());
  await loginAsTestAccount(page, '테스트 A (방장)');

  await page.waitForSelector('.home-summary__count');
  const countText = await page.locator('.home-summary__count').textContent();
  if (!countText.includes('1 / 2')) {
    throw new Error(`Expected 1/2 completion, got: ${countText}`);
  }

  const cards = page.locator('.room-card');
  const cardCount = await cards.count();
  if (cardCount !== 2) throw new Error(`Expected 2 room cards, got ${cardCount}`);

  const firstBadge = await cards.nth(0).locator('.today-status-badge').textContent();
  if (!firstBadge.includes('미완료')) {
    throw new Error(`First card should be incomplete, got: ${firstBadge}`);
  }

  const leaderInvite = cards.filter({ hasText: '초대코드 복사' });
  if (await leaderInvite.count() !== 1) {
    throw new Error('Only leader card should show invite copy');
  }

  const enterButtons = page.getByRole('button', { name: '입장하기' });
  if (await enterButtons.count() !== 2) {
    throw new Error('All cards should have 입장하기 button');
  }

  await enterButtons.first().click();
  await page.waitForURL('**/rooms/**');

  console.log('✓ Home dashboard checks passed');
  await browser.close();
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
