import { getStore, persistStore, nowTimestamp } from '../store.js';
import { getMemberById } from './mockAuthService.js';

export function getRoomChatFeed(roomId) {
  const store = getStore();

  const messages = store.chatMessages
    .filter((m) => m.roomId === roomId && m.isDeleted === 'N')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((message) => {
      const member = getMemberById(message.memberId);
      return {
        ...message,
        memberName: member?.name ?? '?',
        profileImg: member?.profileImg ?? null,
      };
    });

  const byDate = new Map();

  messages.forEach((message) => {
    const checkInDate = message.createdAt.slice(0, 10);
    if (!byDate.has(checkInDate)) {
      byDate.set(checkInDate, []);
    }
    byDate.get(checkInDate).push(message);
  });

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([checkInDate, dayMessages]) => ({
      checkInDate,
      messages: dayMessages,
    }));
}

export function sendChatMessage(roomId, memberId, messageText) {
  const text = messageText.trim().slice(0, 300);
  if (!text) return null;

  const store = getStore();
  const messageId = store.nextIds.message;
  store.nextIds.message += 1;

  const newMessage = {
    messageId,
    roomId,
    memberId,
    messageText: text,
    createdAt: nowTimestamp(),
    isDeleted: 'N',
  };

  store.chatMessages.push(newMessage);
  persistStore();

  const member = getMemberById(memberId);
  return {
    ...newMessage,
    memberName: member?.name ?? '?',
    profileImg: member?.profileImg ?? null,
  };
}

export function markChatAsRead(roomId, memberId) {
  const store = getStore();
  const now = nowTimestamp();
  const existing = store.chatReads.find(
    (read) => read.roomId === roomId && read.memberId === memberId,
  );

  if (existing) {
    existing.lastReadAt = now;
  } else {
    store.chatReads.push({ roomId, memberId, lastReadAt: now });
  }

  persistStore();
}

export function getUnreadChatCount(roomId, memberId) {
  const store = getStore();
  const read = store.chatReads.find(
    (item) => item.roomId === roomId && item.memberId === memberId,
  );
  const lastReadAt = read?.lastReadAt ?? '1970-01-01 00:00:00';

  return store.chatMessages.filter(
    (message) =>
      message.roomId === roomId &&
      message.isDeleted === 'N' &&
      message.memberId !== memberId &&
      message.createdAt > lastReadAt,
  ).length;
}
