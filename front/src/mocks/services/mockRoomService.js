import { getStore, getMockToday, nowTimestamp, persistStore } from '../store.js';
import { generateUniqueInviteCode } from '../utils/inviteCode.js';
import { getMemberById } from './mockAuthService.js';

export function getRoomById(roomId) {
  const store = getStore();
  return store.rooms.find((r) => r.roomId === roomId && r.status === 'Y') ?? null;
}

export function getRoomByInviteCode(inviteCode) {
  const store = getStore();
  return (
    store.rooms.find(
      (r) => r.inviteCode === inviteCode.toUpperCase() && r.status === 'Y',
    ) ?? null
  );
}

export function getRoomMemberCount(roomId) {
  const store = getStore();
  return store.roomMembers.filter((rm) => rm.roomId === roomId && rm.status === 'Y').length;
}

export function isRoomMember(roomId, memberId) {
  const store = getStore();
  return store.roomMembers.some(
    (rm) => rm.roomId === roomId && rm.memberId === memberId && rm.status === 'Y',
  );
}

export function getRoomRole(roomId, memberId) {
  const store = getStore();
  const rm = store.roomMembers.find(
    (r) => r.roomId === roomId && r.memberId === memberId && r.status === 'Y',
  );
  return rm?.roomRole ?? null;
}

export function getMyRooms(memberId) {
  const store = getStore();
  const today = getMockToday();

  return store.roomMembers
    .filter((rm) => rm.memberId === memberId && rm.status === 'Y')
    .map((rm) => {
      const room = store.rooms.find((r) => r.roomId === rm.roomId && r.status === 'Y');
      if (!room) return null;

      const todayCheckIn = store.checkIns.find(
        (ci) =>
          ci.roomId === room.roomId &&
          ci.memberId === memberId &&
          ci.checkInDate === today,
      );

      let todayCheckInStatus = null;
      if (todayCheckIn) {
        todayCheckInStatus = todayCheckIn.status;
      }

      return {
        roomId: room.roomId,
        roomName: room.roomName,
        inviteCode: room.inviteCode,
        memberCount: getRoomMemberCount(room.roomId),
        memberLimit: room.memberLimit,
        roomRole: rm.roomRole,
        todayCheckInStatus,
      };
    })
    .filter(Boolean);
}

export function createRoom({ roomName, memberLimit }, leaderId) {
  const store = getStore();
  const limit = Number(memberLimit);

  if (!roomName?.trim()) {
    throw new Error('암송방 이름을 입력해 주세요.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error('방 정원은 1~20명 사이여야 합니다.');
  }

  const inviteCode = generateUniqueInviteCode(store.rooms);

  const room = {
    roomId: store.nextIds.room,
    leaderId,
    inviteCode,
    roomName: roomName.trim(),
    memberLimit: limit,
    createdAt: nowTimestamp(),
    updatedAt: null,
    status: 'Y',
  };
  store.nextIds.room += 1;
  store.rooms.push(room);

  store.roomMembers.push({
    roomId: room.roomId,
    memberId: leaderId,
    roomRole: 'LEADER',
    createdAt: nowTimestamp(),
    deletedAt: null,
    status: 'Y',
  });

  persistStore();
  return room;
}

export function joinRoom(inviteCode, memberId) {
  const room = getRoomByInviteCode(inviteCode);
  if (!room) {
    throw new Error('존재하지 않는 초대코드입니다.');
  }
  if (isRoomMember(room.roomId, memberId)) {
    throw new Error('이미 참여 중인 암송방입니다.');
  }
  if (getRoomMemberCount(room.roomId) >= room.memberLimit) {
    throw new Error('참여 인원이 가득 찼습니다.');
  }

  const store = getStore();
  store.roomMembers.push({
    roomId: room.roomId,
    memberId,
    roomRole: 'MEMBER',
    createdAt: nowTimestamp(),
    deletedAt: null,
    status: 'Y',
  });

  persistStore();
  return room;
}

export function getRoomMembers(roomId) {
  const store = getStore();
  return store.roomMembers
    .filter((rm) => rm.roomId === roomId && rm.status === 'Y')
    .map((rm) => ({
      ...rm,
      member: getMemberById(rm.memberId),
    }))
    .filter((rm) => rm.member);
}
