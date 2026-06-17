import { seedMembers } from './data/members.js';
import { seedRooms } from './data/rooms.js';
import { seedRoomMembers } from './data/roomMembers.js';
import { seedSections } from './data/sections.js';
import { seedCheckIns } from './data/checkIns.js';
import { seedCheckInDetails } from './data/checkInDetails.js';
import { seedAmens } from './data/amens.js';
import { seedChatMessages } from './data/chatMessages.js';

/** 개발 기준일 — seed data와 일치 (@see docs/MOCK_DATA_GUIDE.md) */
export const MOCK_TODAY = '2026-06-13';

export const STORAGE_KEY = 'mock_member_id';
export const MOCK_STORE_KEY = 'mock_store_data';

function cloneSeed(data) {
  return JSON.parse(JSON.stringify(data));
}

function createSeedState() {
  return {
    members: cloneSeed(seedMembers),
    rooms: cloneSeed(seedRooms),
    roomMembers: cloneSeed(seedRoomMembers),
    sections: cloneSeed(seedSections),
    checkIns: cloneSeed(seedCheckIns),
    checkInDetails: cloneSeed(seedCheckInDetails),
    amens: cloneSeed(seedAmens),
    chatMessages: cloneSeed(seedChatMessages),
    chatReads: [],
    nextIds: {
      member: seedMembers.length + 1,
      room: seedRooms.length + 1,
      section: seedSections.length + 1,
      checkIn: seedCheckIns.length + 1,
      detail: seedCheckInDetails.length + 1,
      amen: seedAmens.length + 1,
      message: seedChatMessages.length + 1,
    },
  };
}

function getPersistedPayload(store) {
  return {
    rooms: store.rooms,
    roomMembers: store.roomMembers,
    sections: store.sections,
    checkIns: store.checkIns,
    checkInDetails: store.checkInDetails,
    amens: store.amens,
    chatMessages: store.chatMessages,
    chatReads: store.chatReads,
    nextIds: store.nextIds,
    members: store.members,
  };
}

function loadPersistedState() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(MOCK_STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeSeedMemberProfiles(members, seedMemberList) {
  const seedByKakaoId = new Map(seedMemberList.map((m) => [m.kakaoId, m]));

  return members.map((member) => {
    const seedMember = seedByKakaoId.get(member.kakaoId);
    if (seedMember?.profileImg) {
      return { ...member, profileImg: seedMember.profileImg };
    }
    return member;
  });
}

function mergeSeedSections(sections, seedSectionList) {
  const seedById = new Map(seedSectionList.map((s) => [s.sectionId, s]));

  return sections.map((section) => {
    const seedSection = seedById.get(section.sectionId);
    if (!seedSection) return section;

    return {
      ...section,
      sectionTitle: seedSection.sectionTitle,
      weeklyRange: seedSection.weeklyRange,
      recitationText: seedSection.recitationText,
    };
  });
}

function initializeStore() {
  const seed = createSeedState();
  const persisted = loadPersistedState();

  if (!persisted) {
    return { state: seed, shouldPersist: false };
  }

  const members = mergeSeedMemberProfiles(
    persisted.members ?? seed.members,
    seed.members,
  );

  const sections = mergeSeedSections(persisted.sections ?? seed.sections, seed.sections);

  const state = {
    members,
    rooms: persisted.rooms ?? seed.rooms,
    roomMembers: persisted.roomMembers ?? seed.roomMembers,
    sections,
    checkIns: persisted.checkIns ?? seed.checkIns,
    checkInDetails: persisted.checkInDetails ?? seed.checkInDetails,
    amens: persisted.amens ?? seed.amens,
    chatMessages: persisted.chatMessages ?? seed.chatMessages,
    chatReads: persisted.chatReads ?? seed.chatReads,
    nextIds: {
      ...seed.nextIds,
      ...(persisted.nextIds ?? {}),
    },
  };

  const shouldPersist =
    JSON.stringify(persisted.members ?? []) !== JSON.stringify(members) ||
    JSON.stringify(persisted.sections ?? []) !== JSON.stringify(sections);

  return { state, shouldPersist };
}

const initResult = initializeStore();
let store = initResult.state;

export function getStore() {
  return store;
}

export function persistStore() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(getPersistedPayload(store)));
}

if (initResult.shouldPersist) {
  persistStore();
}

export function resetStore() {
  store = createSeedState();
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(MOCK_STORE_KEY);
  }
  return store;
}

export function getMockToday() {
  return MOCK_TODAY;
}

export function nowTimestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
