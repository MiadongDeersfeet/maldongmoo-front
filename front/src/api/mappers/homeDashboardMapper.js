export function mapMyRoomToRoomCardData(apiRoom, options = {}) {
  const {
    isTodayCompleted = false,
    participants = [],
  } = options;

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
  };
}

export function buildHomeDashboard(apiRooms = []) {
  const rooms = apiRooms.map((room) => mapMyRoomToRoomCardData(room));

  const totalRoomCount = rooms.length;
  const completedRoomCount = 0;

  return {
    totalRoomCount,
    completedRoomCount,
    pendingRoomCount: totalRoomCount - completedRoomCount,
    rooms,
  };
}
