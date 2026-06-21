/**
 * @param {unknown} createdAt
 * @returns {string}
 */
function extractDatePart(createdAt) {
  if (typeof createdAt !== 'string' || !createdAt) {
    return '';
  }

  if (createdAt.includes('T')) {
    return createdAt.slice(0, 10);
  }

  if (createdAt.includes(' ')) {
    return createdAt.slice(0, 10);
  }

  return createdAt.slice(0, 10);
}

/**
 * @param {unknown} createdAt
 * @returns {string}
 */
function normalizeCreatedAt(createdAt) {
  if (typeof createdAt !== 'string' || !createdAt) {
    return '';
  }

  if (createdAt.includes('T')) {
    return createdAt.replace('T', ' ').slice(0, 19);
  }

  return createdAt.slice(0, 19);
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
  };
}

/**
 * Maps backend chat messages to ChatPanel feed groups.
 * @param {Array<Record<string, unknown>> | null | undefined} messages
 * @returns {Array<{ checkInDate: string, messages: Array<Record<string, unknown>> }>}
 */
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
