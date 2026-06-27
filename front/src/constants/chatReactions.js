/** DB REACTION_TYPE → display emoji (see docs/DB_SPEC.md §9) */
export const CHAT_REACTION_OPTIONS = [
  { type: 'HEART', emoji: '❤️', label: '하트' },
  { type: 'CHECK', emoji: '🙏', label: '하이파이브' },
  { type: 'BEST', emoji: '👍', label: '최고' },
  { type: 'TEAR', emoji: '😢', label: '눈물' },
];

const EMOJI_BY_TYPE = Object.fromEntries(
  CHAT_REACTION_OPTIONS.map(({ type, emoji }) => [type, emoji]),
);

/**
 * @param {string | null | undefined} reactionType
 * @returns {string}
 */
export function getChatReactionEmoji(reactionType) {
  if (typeof reactionType !== 'string') {
    return '';
  }
  return EMOJI_BY_TYPE[reactionType] ?? '';
}
