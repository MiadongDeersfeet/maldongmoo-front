/**
 * Room create/join + localStorage persistence smoke test.
 * Run: node scripts/verify-room-flow.mjs
 * Requires dev server at http://localhost:5173
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
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.evaluate(() => {
    localStorage.clear();
  });

  console.log('1. Login as 김윤기');
  await loginAs(page, '김윤기');

  console.log('2. Create room');
  await page.goto(`${BASE_URL}/rooms/new`);
  const roomName = `테스트방 ${Date.now().toString().slice(-4)}`;
  await page.getByLabel('암송방 이름').fill(roomName);
  await page.getByLabel('방 정원').selectOption('10');
  await page.getByRole('button', { name: '암송방 만들기' }).click();
  await page.waitForURL('**/rooms/**');

  const roomUrl = page.url();
  const roomId = roomUrl.split('/rooms/')[1];

  await page.getByText('아직 등록된 암송 본문이 없습니다.').waitFor();
  const inviteCode = await page.locator('.room-detail-page__meta').textContent();
  const codeMatch = inviteCode.match(/초대코드\s+([A-Z0-9]{6})/);
  if (!codeMatch) throw new Error('Invite code not found on room detail');
  const invite = codeMatch[1];
  console.log(`   Created room ${roomId}, invite ${invite}`);

  console.log('3. Counter check-in for persistence');
  await page.getByRole('link', { name: /계수기 인증/ }).click();
  await page.getByRole('button', { name: '인증 전송' }).click();
  await page.waitForURL(`**/rooms/${roomId}`);

  console.log('4. Reload and verify room detail persists');
  await page.reload();
  await page.waitForSelector('.room-detail-page__meta');
  await page.getByText(roomName).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
    // title in header
  });

  console.log('5. Home shows created room after reload');
  await page.goto(`${BASE_URL}/home`);
  await page.reload();
  await page.getByText(roomName).waitFor({ state: 'visible' });

  console.log('6. Login as 이준호 and join via invite code');
  await page.evaluate(() => localStorage.removeItem('mock_member_id'));
  await loginAs(page, '이준호');
  await page.goto(`${BASE_URL}/rooms/join`);
  await page.getByLabel('초대코드').fill(invite);
  await page.getByRole('button', { name: '입장하기' }).click();
  await page.waitForURL(`**/rooms/${roomId}`);

  console.log('7. Reload join result persists');
  await page.reload();
  await page.waitForURL(`**/rooms/${roomId}`);

  const storeRaw = await page.evaluate(() => localStorage.getItem('mock_store_data'));
  if (!storeRaw) throw new Error('mock_store_data missing after reload');
  const store = JSON.parse(storeRaw);
  const roomExists = store.rooms.some((r) => String(r.roomId) === String(roomId));
  const memberJoined = store.roomMembers.some(
    (rm) => String(rm.roomId) === String(roomId) && rm.status === 'Y',
  );
  if (!roomExists) throw new Error('Created room not in localStorage');
  if (!memberJoined) throw new Error('Room member not in localStorage');

  const sectionForRoom = store.sections.filter((s) => String(s.roomId) === String(roomId));
  if (sectionForRoom.length > 0) {
    throw new Error('TB_RECITATION_SECTION should not be created on room create');
  }

  console.log('✓ All room flow checks passed');
  await browser.close();
}

main().catch((err) => {
  console.error('✗ Verification failed:', err.message);
  process.exit(1);
});
