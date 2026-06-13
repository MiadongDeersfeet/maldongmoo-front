import { getRoomRole } from '@/mocks/services/mockRoomService.js';

export function useRoomRole(roomId, memberId) {
  if (!roomId || !memberId) {
    return { role: null, isLeader: false };
  }

  const role = getRoomRole(Number(roomId), memberId);
  return {
    role,
    isLeader: role === 'LEADER',
  };
}
