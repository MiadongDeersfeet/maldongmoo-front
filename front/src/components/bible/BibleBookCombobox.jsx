import { useEffect, useId, useRef, useState } from 'react';
import { BIBLE_BOOKS } from '@/data/bibleBooks.js';
import { filterBibleBooks } from '@/utils/bibleText.js';
import './BibleBookCombobox.css';

export default function BibleBookCombobox({
  selectedBook,
  onSelectBook,
  disabled = false,
}) {
  const listId = useId();
  const containerRef = useRef(null);
  const [query, setQuery] = useState(selectedBook?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedBook?.name ?? '');
  }, [selectedBook]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const suggestions = filterBibleBooks(query, BIBLE_BOOKS).slice(0, 8);

  const handleSelect = (book) => {
    onSelectBook(book);
    setQuery(book.name);
    setIsOpen(false);
  };

  return (
    <div className="bible-book-combobox" ref={containerRef}>
      <label className="bible-book-combobox__label" htmlFor={`${listId}-input`}>
        성경
      </label>
      <input
        id={`${listId}-input`}
        className="bible-book-combobox__input"
        type="text"
        value={query}
        placeholder="책 이름 입력 (예: 요한, 창세)"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={disabled}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(Boolean(nextQuery.trim()));
          if (!nextQuery.trim()) {
            onSelectBook(null);
          }
        }}
      />
      {isOpen && query.trim() && suggestions.length > 0 && (
        <ul id={listId} className="bible-book-combobox__list" role="listbox">
          {suggestions.map((book) => (
            <li key={book.abbr}>
              <button
                type="button"
                className="bible-book-combobox__option"
                role="option"
                aria-selected={selectedBook?.abbr === book.abbr}
                onClick={() => handleSelect(book)}
              >
                <span>{book.name}</span>
                <span className="bible-book-combobox__abbr">{book.abbr}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
