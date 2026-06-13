const INVITE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

export function isInviteCodeAvailable(code, rooms) {
  return !rooms.some((room) => room.inviteCode === code && room.status === 'Y');
}

export function generateUniqueInviteCode(rooms) {
  let code = generateInviteCode();
  let attempts = 0;
  while (!isInviteCodeAvailable(code, rooms) && attempts < 50) {
    code = generateInviteCode();
    attempts += 1;
  }
  return code;
}
