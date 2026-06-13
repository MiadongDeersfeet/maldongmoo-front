import { getStore, nowTimestamp, persistStore } from '../store.js';

function nextId(key) {
  const store = getStore();
  const id = store.nextIds[key];
  store.nextIds[key] += 1;
  return id;
}

export function getMemberById(memberId) {
  const store = getStore();
  return store.members.find((m) => m.memberId === memberId && m.status === 'Y') ?? null;
}

export function findMemberByKakaoId(kakaoId) {
  const store = getStore();
  return store.members.find((m) => m.kakaoId === kakaoId && m.status === 'Y') ?? null;
}

export function findOrCreateMember({ kakaoId, name, profileImg = null }) {
  const store = getStore();
  const existing = store.members.find((m) => m.kakaoId === kakaoId && m.status === 'Y');
  if (existing) {
    if (name && existing.name !== name) {
      existing.name = name;
    }
    if (profileImg !== undefined) {
      existing.profileImg = profileImg;
    }
    persistStore();
    return existing;
  }

  const member = {
    memberId: nextId('member'),
    kakaoId,
    profileImg,
    name,
    role: 'MEMBER',
    createdAt: nowTimestamp(),
    deletedAt: null,
    status: 'Y',
  };
  store.members.push(member);
  persistStore();
  return member;
}
