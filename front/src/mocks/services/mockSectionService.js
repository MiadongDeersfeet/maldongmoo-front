import { getStore, nowTimestamp, persistStore } from '../store.js';
import { getRoomRole } from './mockRoomService.js';

export function getActiveSection(roomId) {
  const store = getStore();
  const sections = store.sections
    .filter((s) => s.roomId === roomId && s.status === 'Y' && s.isActive === 'Y')
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return sections[0] ?? null;
}

export function getSectionsByRoom(roomId) {
  const store = getStore();
  return store.sections
    .filter((s) => s.roomId === roomId && s.status === 'Y')
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function assertLeader(roomId, memberId) {
  const role = getRoomRole(roomId, memberId);
  if (role !== 'LEADER') {
    throw new Error('방장만 본문을 등록·수정할 수 있습니다.');
  }
}

export function createSection(roomId, input, leaderMemberId) {
  assertLeader(roomId, leaderMemberId);
  const store = getStore();

  if (input.isActive === 'Y') {
    store.sections.forEach((s) => {
      if (s.roomId === roomId && s.status === 'Y') {
        s.isActive = 'N';
      }
    });
  }

  const section = {
    sectionId: store.nextIds.section,
    roomId,
    sectionTitle: input.sectionTitle,
    weeklyRange: input.weeklyRange,
    recitationText: input.recitationText,
    displayOrder: input.displayOrder ?? 1,
    isActive: input.isActive ?? 'Y',
    createdAt: nowTimestamp(),
    updatedAt: null,
    status: 'Y',
  };
  store.nextIds.section += 1;
  store.sections.push(section);
  persistStore();
  return section;
}

export function updateSection(sectionId, input, leaderMemberId) {
  const store = getStore();
  const section = store.sections.find((s) => s.sectionId === sectionId && s.status === 'Y');
  if (!section) {
    throw new Error('섹션을 찾을 수 없습니다.');
  }

  assertLeader(section.roomId, leaderMemberId);

  if (input.isActive === 'Y') {
    store.sections.forEach((s) => {
      if (s.roomId === section.roomId && s.status === 'Y' && s.sectionId !== sectionId) {
        s.isActive = 'N';
      }
    });
  }

  Object.assign(section, input, { updatedAt: nowTimestamp() });
  persistStore();
  return section;
}
