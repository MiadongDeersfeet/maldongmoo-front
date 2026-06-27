import { extractDisplayDatePart, normalizeApiDateTime } from '@/utils/date.js';

function extractDatePart(createdAt) {
  return extractDisplayDatePart(createdAt);
}

function normalizeCreatedAt(createdAt) {
  return normalizeApiDateTime(createdAt);
}

/**
 * @param {unknown} reactions
 * @returns {Array<{ reactionType: string, count: number }>}
 */
function mapChatReactions(reactions) {
  if (!Array.isArray(reactions)) {
    return [];
  }

  return reactions
    .filter((reaction) => reaction && typeof reaction.reactionType === 'string')
    .map((reaction) => ({
      reactionType: reaction.reactionType,
      count: typeof reaction.count === 'number' ? reaction.count : 0,
    }))
    .filter((reaction) => reaction.count > 0);
}

/**
 * @param {Record<string, unknown>} message
 */
function mapChatMessage(message) {
  const profileImg =
    (typeof message.profileImg === 'string' && message.profileImg) ||
    (typeof message.profileImageUrl === 'string' && message.profileImageUrl) ||
    null;

  return {
    messageId: message.messageId,
    roomId: message.roomId,
    memberId: message.memberId,
    memberName: typeof message.memberName === 'string' ? message.memberName : '?',
    profileImg,
    messageText: typeof message.messageText === 'string' ? message.messageText : '',
    createdAt: normalizeCreatedAt(message.createdAt),
    isDeleted: typeof message.isDeleted === 'string' ? message.isDeleted : 'N',
    unreadCount: typeof message.unreadCount === 'number'
      ? message.unreadCount
      : typeof message.readCount === 'number'
        ? message.readCount
        : null,
    reactions: mapChatReactions(message.reactions),
    myReactionType: typeof message.myReactionType === 'string' ? message.myReactionType : null,
  };
}

/**
 * Maps backend chat messages to ChatPanel feed groups.
 * @param {Array<Record<string, unknown>> | null | undefined} messages
 * @returns {Array<{ checkInDate: string, messages: Array<Record<string, unknown>> }>}
 */
function getLatestChatMessageId(chatFeed) {
  if (!Array.isArray(chatFeed) || chatFeed.length === 0) {
    return null;
  }

  const lastDay = chatFeed[chatFeed.length - 1];
  if (!lastDay?.messages?.length) {
    return null;
  }

  const lastMessage = lastDay.messages[lastDay.messages.length - 1];
  return lastMessage?.messageId ?? null;
}

export { getLatestChatMessageId };
export function mapChatMessagesToFeed(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const sorted = [...messages].sort((left, right) => {
    const leftTime = normalizeCreatedAt(left.createdAt);
    const rightTime = normalizeCreatedAt(right.createdAt);
    return leftTime.localeCompare(rightTime);
  });

  const byDate = new Map();

  sorted.forEach((message) => {
    const mapped = mapChatMessage(message);
    const checkInDate = extractDatePart(mapped.createdAt);
    if (!checkInDate) {
      return;
    }

    if (!byDate.has(checkInDate)) {
      byDate.set(checkInDate, []);
    }
    byDate.get(checkInDate).push(mapped);
  });

  return Array.from(byDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([checkInDate, dayMessages]) => ({
      checkInDate,
      messages: dayMessages,
    }));
}

/**
 * Appends a single chat message to an existing feed without duplicate messageId.
 * @param {Array<{ checkInDate: string, messages: Array<Record<string, unknown>> }>} prevFeed
 * @param {Record<string, unknown>} rawMessage
 */
export function appendChatMessageToFeed(prevFeed, rawMessage) {
  const mapped = mapChatMessage(rawMessage);
  if (!mapped.messageId) {
    return prevFeed;
  }

  const alreadyExists = prevFeed.some((day) =>
    day.messages.some((message) => message.messageId === mapped.messageId),
  );
  if (alreadyExists) {
    return prevFeed;
  }

  const checkInDate = extractDatePart(mapped.createdAt);
  if (!checkInDate) {
    return prevFeed;
  }

  const dayIndex = prevFeed.findIndex((day) => day.checkInDate === checkInDate);
  if (dayIndex === -1) {
    return [...prevFeed, { checkInDate, messages: [mapped] }].sort((left, right) =>
      left.checkInDate.localeCompare(right.checkInDate),
    );
  }

  return prevFeed.map((day, index) =>
    index === dayIndex
      ? { ...day, messages: [...day.messages, mapped] }
      : day,
  );
}

/**
 * Updates reaction counts on a message in the feed.
 * @param {Array<{ checkInDate: string, messages: Array<Record<string, unknown>> }>} prevFeed
 * @param {Record<string, unknown>} payload
 * @param {{ memberId?: number | null }} [options]
 */
export function updateChatReactionOnFeed(prevFeed, payload, options = {}) {
  const messageId = Number(payload?.messageId);
  if (!Number.isFinite(messageId)) {
    return prevFeed;
  }

  const reactions = mapChatReactions(payload.reactions);
  const myReactionType =
    typeof payload.myReactionType === 'string'
      ? payload.myReactionType
      : undefined;

  return prevFeed.map((day) => ({
    ...day,
    messages: day.messages.map((message) => {
      if (message.messageId !== messageId) {
        return message;
      }

      const nextMessage = {
        ...message,
        reactions,
      };

      if (myReactionType !== undefined) {
        nextMessage.myReactionType = myReactionType;
      }

      return nextMessage;
    }),
  }));
}
