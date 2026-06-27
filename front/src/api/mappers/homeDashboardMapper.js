export function isTodayCheckInCompleted(todayCheckIn) {
  return todayCheckIn?.checkedIn === true || todayCheckIn?.status === 'Y';
}

export function mapMyRoomToRoomCardData(apiRoom, options = {}) {
  const {
    isTodayCompleted = false,
    participants = [],
  } = options;

  const unreadChatCount = apiRoom.unreadChatCount ?? 0;
  const unreadCheckInCount = apiRoom.unreadCheckInCount ?? 0;
  const hasNewActivity = apiRoom.hasNewActivity === true
    || unreadChatCount > 0
    || unreadCheckInCount > 0;

  return {
    room: {
      roomId: apiRoom.roomId,
      roomName: apiRoom.roomName,
      memberLimit: apiRoom.memberLimit ?? 0,
      inviteCode: apiRoom.inviteCode ?? null,
      leaderId: apiRoom.leaderId,
      joinedAt: apiRoom.joinedAt,
    },
    memberCount: apiRoom.memberCount ?? 0,
    roomRole: apiRoom.myRole,
    isTodayCompleted,
    participants,
    unreadChatCount,
    unreadCheckInCount,
    hasNewActivity,
  };
}

export function buildHomeDashboardFromRooms(rooms = []) {
  const completedRoomCount = rooms.filter((room) => room.isTodayCompleted).length;

  return {
    totalRoomCount: rooms.length,
    completedRoomCount,
    pendingRoomCount: rooms.length - completedRoomCount,
    rooms,
  };
}

export function buildHomeDashboard(apiRooms = []) {
  const rooms = apiRooms.map((room) => mapMyRoomToRoomCardData(room));

  return buildHomeDashboardFromRooms(rooms);
}
