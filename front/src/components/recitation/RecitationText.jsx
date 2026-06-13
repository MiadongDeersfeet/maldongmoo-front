import { parsePassageLine, splitPassageLines } from '@/utils/recitationText.js';
import './RecitationText.css';

function renderPassageLine(line, index) {
  if (line.length === 0) {
    return <div key={index} className="passage-spacer" aria-hidden="true" />;
  }

  const parsed = parsePassageLine(line);

  if (parsed.type === 'verse') {
    return (
      <div key={index} className="verse-line">
        <span className="verse-number">{parsed.number}</span>
        <span className="verse-text">{parsed.text}</span>
      </div>
    );
  }

  return (
    <p key={index} className="passage-plain-line">
      {parsed.content}
    </p>
  );
}

export default function RecitationText({ text, size = 'md' }) {
  if (!text?.trim()) {
    return null;
  }

  const lines = splitPassageLines(text);

  return (
    <div className={`recitation-text recitation-text--${size}`}>
      <div className="recitation-text__body">{lines.map(renderPassageLine)}</div>
    </div>
  );
}
