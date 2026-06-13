import { getStore } from '../store.js';
import { getMemberById } from './mockAuthService.js';

function getAmenCount(checkInId) {
  const store = getStore();
  return store.amens.filter((a) => a.checkInId === checkInId && a.status === 'Y').length;
}

function isAmenedByMe(checkInId, currentMemberId) {
  const store = getStore();
  return store.amens.some(
    (a) =>
      a.checkInId === checkInId &&
      a.memberId === currentMemberId &&
      a.status === 'Y',
  );
}

export function getRoomFeed(roomId, currentMemberId) {
  const store = getStore();

  const validCheckIns = store.checkIns.filter(
    (ci) => ci.roomId === roomId && ci.status === 'Y',
  );

  const byDate = new Map();

  validCheckIns.forEach((checkIn) => {
    const member = getMemberById(checkIn.memberId);
    if (!member) return;

    const details = store.checkInDetails
      .filter((d) => d.checkInId === checkIn.checkInId && d.status === 'Y')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((d) => ({
        detailId: d.detailId,
        checkInType: d.checkInType,
        audioUrl: d.audioUrl,
        counterValue: d.counterValue,
        createdAt: d.createdAt,
      }));

    if (details.length === 0) return;

    const earliestTime = details[0]?.createdAt ?? '';

    const card = {
      checkInId: checkIn.checkInId,
      memberId: checkIn.memberId,
      memberName: member.name,
      profileImg: member.profileImg,
      amenCount: getAmenCount(checkIn.checkInId),
      isAmenedByMe: isAmenedByMe(checkIn.checkInId, currentMemberId),
      details,
      sortTime: earliestTime,
    };

    if (!byDate.has(checkIn.checkInDate)) {
      byDate.set(checkIn.checkInDate, []);
    }
    byDate.get(checkIn.checkInDate).push(card);
  });

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([checkInDate, checkIns]) => ({
      checkInDate,
      checkIns: checkIns.sort((a, b) => a.sortTime.localeCompare(b.sortTime)),
    }));
}
