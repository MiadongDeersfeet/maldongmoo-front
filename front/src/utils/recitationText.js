export const PASSAGE_LABEL = '이번주 본문';

const VERSE_LINE_PATTERN = /^(\d{1,3})\s+(.*)$/;

export function getRecitationPreview(text, maxLength = 60) {
  if (!text?.trim()) return '본문을 등록하면 여기에 미리보기가 표시됩니다';

  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength)}…`;
}

export function splitPassageLines(text) {
  return text.split('\n');
}

export function parsePassageLine(line) {
  const match = line.match(VERSE_LINE_PATTERN);
  if (!match) {
    return { type: 'plain', content: line };
  }
  return { type: 'verse', number: match[1], text: match[2] };
}
