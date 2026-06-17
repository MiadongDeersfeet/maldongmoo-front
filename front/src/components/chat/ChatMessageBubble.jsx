import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import './ChatMessageBubble.css';

function formatChatTime(createdAt) {
  const timePart = createdAt.includes(' ') ? createdAt.split(' ')[1] : createdAt;
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = Number(hourStr);
  const minute = minuteStr ?? '00';
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${minute}`;
}

export default function ChatMessageBubble({ message, isMine }) {
  const timeLabel = formatChatTime(message.createdAt);

  if (isMine) {
    return (
      <div className="chat-message-row is-mine">
        <div className="chat-message-content">
          <div className="chat-message-meta">
            <span>{timeLabel}</span>
          </div>
          <div className="chat-bubble">{message.messageText}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-row">
      <AvatarCircle
        name={message.memberName}
        profileImg={message.profileImg}
        size="xs"
        className="chat-avatar"
      />
      <div className="chat-message-content">
        <div className="chat-message-meta">
          <span className="chat-message-name">{message.memberName}</span>
          <span>{timeLabel}</span>
        </div>
        <div className="chat-bubble">{message.messageText}</div>
      </div>
    </div>
  );
}
