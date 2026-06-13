import { getStore, getMockToday, nowTimestamp, persistStore } from '../store.js';
import { getRoomMemberCount } from './mockRoomService.js';
import { getMemberById } from './mockAuthService.js';

function isMemberCompletedToday(store, roomId, memberId, today) {
  const checkIn = store.checkIns.find(
    (ci) =>
      ci.roomId === roomId &&
      ci.memberId === memberId &&
      ci.checkInDate === today &&
      ci.status === 'Y',
  );
  if (!checkIn) return false;
  return store.checkInDetails.some((d) => d.checkInId === checkIn.checkInId && d.status === 'Y');
}

function findOrCreateCheckIn(roomId, memberId, date) {
  const store = getStore();
  let checkIn = store.checkIns.find(
    (ci) => ci.roomId === roomId && ci.memberId === memberId && ci.checkInDate === date,
  );

  if (!checkIn) {
    checkIn = {
      checkInId: store.nextIds.checkIn,
      roomId,
      memberId,
      checkInDate: date,
      createdAt: nowTimestamp(),
      updatedAt: null,
      status: 'Y',
    };
    store.nextIds.checkIn += 1;
    store.checkIns.push(checkIn);
  }

  return checkIn;
}

function syncCheckInStatus(checkInId) {
  const store = getStore();
  const checkIn = store.checkIns.find((ci) => ci.checkInId === checkInId);
  if (!checkIn) return;

  const hasValidDetail = store.checkInDetails.some(
    (d) => d.checkInId === checkInId && d.status === 'Y',
  );
  checkIn.status = hasValidDetail ? 'Y' : 'N';
  checkIn.updatedAt = nowTimestamp();
}

export function getTodayCheckInStatus(roomId, memberId) {
  const store = getStore();
  const today = getMockToday();
  const checkIn = store.checkIns.find(
    (ci) => ci.roomId === roomId && ci.memberId === memberId && ci.checkInDate === today,
  );

  if (!checkIn) {
    return { checkInId: null, status: null };
  }

  return { checkInId: checkIn.checkInId, status: checkIn.status };
}

export function getTodayCheckInSummary(roomId, memberId) {
  const { checkInId, status } = getTodayCheckInStatus(roomId, memberId);
  if (!checkInId || status !== 'Y') {
    return { status, lastDetail: null };
  }

  const store = getStore();
  const lastDetail =
    store.checkInDetails
      .filter((d) => d.checkInId === checkInId && d.status === 'Y')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;

  return { status, lastDetail };
}

export function getTodayRoomDashboard(roomId, memberId) {
  const store = getStore();
  const today = getMockToday();
  const totalMemberCount = getRoomMemberCount(roomId);
  const { status: myStatus } = getTodayCheckInStatus(roomId, memberId);

  const todayCheckIns = store.checkIns.filter(
    (ci) => ci.roomId === roomId && ci.checkInDate === today && ci.status === 'Y',
  );

  const todayCompletedCount = todayCheckIns.filter((ci) =>
    store.checkInDetails.some((d) => d.checkInId === ci.checkInId && d.status === 'Y'),
  ).length;

  const todayCheckInIds = new Set(todayCheckIns.map((ci) => ci.checkInId));
  const todayAmenCount = store.amens.filter(
    (a) => todayCheckInIds.has(a.checkInId) && a.status === 'Y',
  ).length;

  const completedMembers = [];
  const pendingMembers = [];

  store.roomMembers
    .filter((rm) => rm.roomId === roomId && rm.status === 'Y')
    .forEach((rm) => {
      const member = getMemberById(rm.memberId);
      if (!member) return;

      const profile = {
        memberId: member.memberId,
        name: member.name,
        profileImg: member.profileImg,
      };

      if (isMemberCompletedToday(store, roomId, rm.memberId, today)) {
        completedMembers.push(profile);
      } else {
        pendingMembers.push(profile);
      }
    });

  return {
    todayCompletedCount,
    totalMemberCount,
    myStatus,
    todayAmenCount,
    completedMembers,
    pendingMembers,
  };
}

export function submitVoiceCheckIn(roomId, memberId, audioUrl) {
  const store = getStore();
  const today = getMockToday();
  const checkIn = findOrCreateCheckIn(roomId, memberId, today);

  const detail = {
    detailId: store.nextIds.detail,
    checkInId: checkIn.checkInId,
    checkInType: 'VOICE',
    audioUrl,
    counterValue: null,
    createdAt: nowTimestamp(),
    deletedAt: null,
    status: 'Y',
  };
  store.nextIds.detail += 1;
  store.checkInDetails.push(detail);

  checkIn.status = 'Y';
  checkIn.updatedAt = nowTimestamp();
  persistStore();
  return detail;
}

export function submitCounterCheckIn(roomId, memberId, counterValue) {
  const store = getStore();
  const today = getMockToday();
  const checkIn = findOrCreateCheckIn(roomId, memberId, today);

  const detail = {
    detailId: store.nextIds.detail,
    checkInId: checkIn.checkInId,
    checkInType: 'COUNTER',
    audioUrl: null,
    counterValue,
    createdAt: nowTimestamp(),
    deletedAt: null,
    status: 'Y',
  };
  store.nextIds.detail += 1;
  store.checkInDetails.push(detail);

  checkIn.status = 'Y';
  checkIn.updatedAt = nowTimestamp();
  persistStore();
  return detail;
}

export function cancelCheckInDetail(detailId) {
  const store = getStore();
  const detail = store.checkInDetails.find((d) => d.detailId === detailId);
  if (!detail || detail.status === 'N') {
    throw new Error('취소할 인증 기록을 찾을 수 없습니다.');
  }

  detail.status = 'N';
  detail.deletedAt = nowTimestamp();
  syncCheckInStatus(detail.checkInId);
  persistStore();
  return detail;
}

export function toggleAmen(checkInId, memberId) {
  const store = getStore();
  const checkIn = store.checkIns.find((ci) => ci.checkInId === checkInId);
  if (!checkIn) {
    throw new Error('인증 카드를 찾을 수 없습니다.');
  }
  if (checkIn.memberId === memberId) {
    throw new Error('자기 자신의 인증 카드에는 아멘을 누를 수 없습니다.');
  }

  const existing = store.amens.find(
    (a) => a.memberId === memberId && a.checkInId === checkInId,
  );

  if (!existing) {
    const amen = {
      amenId: store.nextIds.amen,
      memberId,
      checkInId,
      createdAt: nowTimestamp(),
      updatedAt: null,
      status: 'Y',
    };
    store.nextIds.amen += 1;
    store.amens.push(amen);
    persistStore();
    return { status: 'Y', amenCount: getAmenCount(checkInId) };
  }

  existing.status = existing.status === 'Y' ? 'N' : 'Y';
  existing.updatedAt = nowTimestamp();
  persistStore();
  return { status: existing.status, amenCount: getAmenCount(checkInId) };
}

function getAmenCount(checkInId) {
  const store = getStore();
  return store.amens.filter((a) => a.checkInId === checkInId && a.status === 'Y').length;
}
