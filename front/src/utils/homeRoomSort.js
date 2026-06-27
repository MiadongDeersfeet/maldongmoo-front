export const HOME_ROOM_SORT_STORAGE_KEY = 'maldongmoo.home.roomSortOrder';
export const DEFAULT_HOME_ROOM_SORT_ORDER = 'pending-first';

/**
 * @returns {'pending-first' | 'completed-first'}
 */
export function getStoredHomeRoomSortOrder() {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_HOME_ROOM_SORT_ORDER;
  }

  const stored = localStorage.getItem(HOME_ROOM_SORT_STORAGE_KEY);
  if (stored === 'completed-first' || stored === 'pending-first') {
    return stored;
  }

  return DEFAULT_HOME_ROOM_SORT_ORDER;
}

/**
 * @param {'pending-first' | 'completed-first'} sortOrder
 */
export function saveHomeRoomSortOrder(sortOrder) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  if (sortOrder === 'completed-first' || sortOrder === 'pending-first') {
    localStorage.setItem(HOME_ROOM_SORT_STORAGE_KEY, sortOrder);
  }
}

/**
 * @param {Array<{ isTodayCompleted?: boolean, room: { roomName: string } }>} rooms
 * @param {'pending-first' | 'completed-first'} sortOrder
 */
export function sortHomeRooms(rooms, sortOrder) {
  return [...rooms].sort((left, right) => {
    const leftCompleted = left.isTodayCompleted ? 1 : 0;
    const rightCompleted = right.isTodayCompleted ? 1 : 0;

    if (leftCompleted !== rightCompleted) {
      if (sortOrder === 'completed-first') {
        return rightCompleted - leftCompleted;
      }
      return leftCompleted - rightCompleted;
    }

    return (left.room?.roomName ?? '').localeCompare(right.room?.roomName ?? '', 'ko');
  });
}

export const HOME_COMING_SOON_FEATURES = {
  records: {
    featureName: '암송 기록',
    description: '함께한 암송 기록과 통계를 한눈에 볼 수 있는 기능을 준비하고 있어요.',
  },
  bible: {
    featureName: '성경',
    description: '말씀을 더 편하게 찾고 암송할 수 있는 성경 기능을 준비하고 있어요.',
  },
  more: {
    featureName: '더보기',
    description: '설정과 다양한 편의 기능을 모아둘 더보기 메뉴를 준비하고 있어요.',
  },
};
