import { getStore, getMockToday } from '../store.js';
import { getMemberById } from './mockAuthService.js';
import { getRoomMemberCount, getRoomMembers } from './mockRoomService.js';

function getActiveSectionForRoom(roomId) {
  const store = getStore();
  return (
    store.sections
      .filter((s) => s.roomId === roomId && s.status === 'Y' && s.isActive === 'Y')
      .sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? null
  );
}

function getTodayCheckIn(roomId, memberId, today) {
  const store = getStore();
  return (
    store.checkIns.find(
      (ci) =>
        ci.roomId === roomId && ci.memberId === memberId && ci.checkInDate === today,
    ) ?? null
  );
}

function getLastValidDetail(checkInId) {
  const store = getStore();
  const details = store.checkInDetails
    .filter((d) => d.checkInId === checkInId && d.status === 'Y')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return details[0] ?? null;
}

export function getHomeDashboard(memberId) {
  const today = getMockToday();
  const member = getMemberById(memberId);
  const store = getStore();

  const rooms = store.roomMembers
    .filter((rm) => rm.memberId === memberId && rm.status === 'Y')
    .map((membership) => {
      const room = store.rooms.find((r) => r.roomId === membership.roomId && r.status === 'Y');
      if (!room) return null;

      const todayCheckIn = getTodayCheckIn(room.roomId, memberId, today);
      const isTodayCompleted = todayCheckIn?.status === 'Y';
      const lastDetail =
        todayCheckIn && isTodayCompleted
          ? getLastValidDetail(todayCheckIn.checkInId)
          : null;

      return {
        room,
        membership,
        activeSection: getActiveSectionForRoom(room.roomId),
        memberCount: getRoomMemberCount(room.roomId),
        participants: getRoomMembers(room.roomId).map((rm) => ({
          memberId: rm.member.memberId,
          name: rm.member.name,
          profileImg: rm.member.profileImg,
        })),
        todayCheckIn,
        lastDetail,
        isTodayCompleted,
        roomRole: membership.roomRole,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isTodayCompleted === b.isTodayCompleted) {
        return a.room.roomName.localeCompare(b.room.roomName, 'ko');
      }
      return a.isTodayCompleted ? 1 : -1;
    });

  const completedRoomCount = rooms.filter((r) => r.isTodayCompleted).length;

  return {
    member,
    today,
    totalRoomCount: rooms.length,
    completedRoomCount,
    pendingRoomCount: rooms.length - completedRoomCount,
    rooms,
  };
}
