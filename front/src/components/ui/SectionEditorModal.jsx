import { useEffect, useState } from 'react';
import AppModal from '@/components/ui/AppModal.jsx';
import BibleBookCombobox from '@/components/bible/BibleBookCombobox.jsx';
import { validateSectionContent } from '@/utils/sectionForm.js';
import { buildSectionFromPassage, extractPassage, loadBibleData } from '@/utils/bibleText.js';
import './SectionEditorModal.css';

/**
 * @typedef {Object} SectionEditorPayload
 * @property {string} sectionTitle
 * @property {string} sectionRange
 * @property {string} sectionContent
 */

export default function SectionEditorModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialContent = '',
  initialTitle = '',
  initialRange = '',
  isSubmitting = false,
}) {
  const [inputMode, setInputMode] = useState('bible');
  const [content, setContent] = useState(initialContent);
  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [sectionRange, setSectionRange] = useState(initialRange);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapter, setChapter] = useState('');
  const [startVerse, setStartVerse] = useState('');
  const [endVerse, setEndVerse] = useState('');
  const [isBibleLoading, setIsBibleLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setContent(initialContent);
    setSectionTitle(initialTitle);
    setSectionRange(initialRange);
    setInputMode('bible');
    setSelectedBook(null);
    setChapter('');
    setStartVerse('');
    setEndVerse('');
    setError(null);
  }, [isOpen, initialContent, initialTitle, initialRange]);

  const title = mode === 'edit' ? '암송 본문 수정' : '암송 본문 등록';
  const submitLabel = mode === 'edit' ? '저장' : '등록';

  const handleApplyPassage = async () => {
    setError(null);

    if (!selectedBook) {
      setError('성경 권을 선택해 주세요.');
      return;
    }

    const chapterNumber = Number(chapter);
    const startVerseNumber = Number(startVerse);
    const endVerseNumber = endVerse ? Number(endVerse) : startVerseNumber;

    setIsBibleLoading(true);
    try {
      const bible = await loadBibleData();
      const passage = extractPassage(
        bible,
        selectedBook.abbr,
        chapterNumber,
        startVerseNumber,
        endVerseNumber,
      );
      const section = buildSectionFromPassage(passage);
      setSectionTitle(section.sectionTitle);
      setSectionRange(section.sectionRange);
      setContent(section.sectionContent);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : '본문을 불러오지 못했습니다.');
    } finally {
      setIsBibleLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateSectionContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    /** @type {SectionEditorPayload} */
    const payload = {
      sectionTitle: sectionTitle.trim(),
      sectionRange: sectionRange.trim(),
      sectionContent: content.trim(),
    };

    setError(null);
    await onSubmit(payload);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="app-modal__btn app-modal__btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="button"
            className="app-modal__btn app-modal__btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting || isBibleLoading}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <div className="section-editor-modal">
        <div className="section-editor-modal__tabs" role="tablist" aria-label="본문 입력 방식">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'bible'}
            className={`section-editor-modal__tab ${inputMode === 'bible' ? 'is-active' : ''}`}
            onClick={() => setInputMode('bible')}
            disabled={isSubmitting}
          >
            성경에서 선택
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'manual'}
            className={`section-editor-modal__tab ${inputMode === 'manual' ? 'is-active' : ''}`}
            onClick={() => setInputMode('manual')}
            disabled={isSubmitting}
          >
            직접 입력
          </button>
        </div>

        {error ? <p className="section-editor-modal__error">{error}</p> : null}

        {inputMode === 'bible' ? (
          <div className="section-editor-modal__bible-panel">
            <BibleBookCombobox
              selectedBook={selectedBook}
              onSelectBook={setSelectedBook}
              disabled={isSubmitting || isBibleLoading}
            />

            <div className="section-editor-modal__number-row">
              <label className="section-editor-modal__field">
                <span>장</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={chapter}
                  onChange={(event) => setChapter(event.target.value)}
                  disabled={isSubmitting || isBibleLoading}
                />
              </label>
              <label className="section-editor-modal__field">
                <span>시작 절</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={startVerse}
                  onChange={(event) => setStartVerse(event.target.value)}
                  disabled={isSubmitting || isBibleLoading}
                />
              </label>
              <label className="section-editor-modal__field">
                <span>끝 절</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={endVerse}
                  onChange={(event) => setEndVerse(event.target.value)}
                  placeholder="선택"
                  disabled={isSubmitting || isBibleLoading}
                />
              </label>
            </div>

            <button
              type="button"
              className="section-editor-modal__apply-btn"
              onClick={handleApplyPassage}
              disabled={isSubmitting || isBibleLoading}
            >
              {isBibleLoading ? '불러오는 중...' : '본문 불러오기'}
            </button>

            {(sectionTitle || sectionRange) && (
              <p className="section-editor-modal__meta">
                {sectionTitle}
                {sectionRange ? ` · ${sectionRange}` : ''}
              </p>
            )}

            <textarea
              className="section-editor-modal__textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="권·장·절을 선택한 뒤 「본문 불러오기」를 눌러 주세요."
              disabled={isSubmitting || isBibleLoading}
              rows={8}
            />
          </div>
        ) : (
          <textarea
            className="section-editor-modal__textarea"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (!sectionTitle) {
                setSectionTitle('');
                setSectionRange('');
              }
            }}
            placeholder="이번 주 암송할 본문을 입력해 주세요."
            disabled={isSubmitting}
            rows={8}
          />
        )}
      </div>
    </AppModal>
  );
}
