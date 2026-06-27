import { findBookByAbbr } from '@/data/bibleBooks.js';

let bibleDataPromise = null;
/** @type {Record<string, Record<number, number>> | null} */
let chapterVerseIndex = null;

/**
 * @returns {Promise<Record<string, string>>}
 */
export async function loadBibleData() {
  if (!bibleDataPromise) {
    bibleDataPromise = fetch('/bible/bible.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('성경 데이터를 불러오지 못했습니다.');
        }
        return response.json();
      })
      .then((data) => {
        chapterVerseIndex = buildChapterVerseIndex(data);
        return data;
      });
  }

  return bibleDataPromise;
}

/**
 * @param {Record<string, string>} data
 * @returns {Record<string, Record<number, number>>}
 */
function buildChapterVerseIndex(data) {
  /** @type {Record<string, Record<number, number>>} */
  const index = {};

  Object.keys(data).forEach((key) => {
    const match = key.match(/^(.+?)(\d+):(\d+)$/);
    if (!match) {
      return;
    }

    const [, abbr, chapterStr, verseStr] = match;
    const chapter = Number(chapterStr);
    const verse = Number(verseStr);

    if (!index[abbr]) {
      index[abbr] = {};
    }
    index[abbr][chapter] = Math.max(index[abbr][chapter] ?? 0, verse);
  });

  return index;
}

/**
 * @param {string} abbr
 * @param {number} chapter
 */
export function getMaxVerseInChapter(abbr, chapter) {
  if (!chapterVerseIndex?.[abbr]?.[chapter]) {
    return null;
  }
  return chapterVerseIndex[abbr][chapter];
}

/**
 * @param {string} query
 * @param {import('@/data/bibleBooks.js').BIBLE_BOOKS} books
 */
export function filterBibleBooks(query, books) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return books.filter(
    (book) =>
      book.name.toLowerCase().includes(normalized)
      || book.abbr.toLowerCase().includes(normalized),
  );
}

/**
 * @param {Record<string, string>} bible
 * @param {string} abbr
 * @param {number} chapter
 * @param {number} startVerse
 * @param {number} endVerse
 */
export function extractPassage(bible, abbr, chapter, startVerse, endVerse) {
  const book = findBookByAbbr(abbr);
  if (!book) {
    throw new Error('성경 권을 찾을 수 없습니다.');
  }
  if (!Number.isInteger(chapter) || chapter < 1) {
    throw new Error('장 번호를 확인해 주세요.');
  }
  if (!Number.isInteger(startVerse) || !Number.isInteger(endVerse) || startVerse < 1 || endVerse < startVerse) {
    throw new Error('절 범위를 확인해 주세요.');
  }

  const maxVerse = getMaxVerseInChapter(abbr, chapter);
  if (!maxVerse) {
    throw new Error(`${book.name} ${chapter}장을 찾을 수 없습니다.`);
  }
  if (endVerse > maxVerse) {
    throw new Error(`${book.name} ${chapter}장은 ${maxVerse}절까지 있습니다.`);
  }

  const verses = [];
  for (let verse = startVerse; verse <= endVerse; verse += 1) {
    const key = `${abbr}${chapter}:${verse}`;
    const text = bible[key];
    if (typeof text !== 'string') {
      throw new Error(`${book.name} ${chapter}:${verse}절을 찾을 수 없습니다.`);
    }
    verses.push({ verse, text: text.trim() });
  }

  return { book, chapter, startVerse, endVerse, verses };
}

/**
 * @param {{ book: { name: string }, chapter: number, startVerse: number, endVerse: number, verses: Array<{ verse: number, text: string }> }} passage
 */
export function buildSectionFromPassage(passage) {
  const { book, chapter, startVerse, endVerse, verses } = passage;

  return {
    sectionTitle: `${book.name} ${chapter}장`,
    sectionRange: startVerse === endVerse ? `${startVerse}절` : `${startVerse}~${endVerse}절`,
    sectionContent: verses.map((item) => `${item.verse}. ${item.text}`).join('\n'),
  };
}
