import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import MemberProfileStrip from '@/components/ui/MemberProfileStrip.jsx';
import { useAuth } from '@/hooks/useAuth.js';import { getRoomById, submitVoiceCheckIn } from '@/mocks/index.js';
import './CheckInPage.css';

export default function VoiceCheckInPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { member } = useAuth();
  const numericRoomId = Number(roomId);
  const room = getRoomById(numericRoomId);

  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleToggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!isRecording) {
      setError('먼저 녹음을 시작해 주세요.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      submitVoiceCheckIn(
        numericRoomId,
        member.memberId,
        `https://mock.storage/audio/${Date.now()}.mp3`,
      );
      navigate(`/rooms/${roomId}`, { replace: true });
    } catch {
      setError('인증 전송에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  if (!room) {
    return (
      <AppShell title="녹음 인증" showBack>
        <PageContainer>
          <div className="page-placeholder">
            <h1>방을 찾을 수 없습니다</h1>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="녹음 인증" showBack member={member}>
      <PageContainer>
        <div className="check-in-page">
          <MemberProfileStrip
            name={member.name}
            profileImg={member.profileImg}
            subtitle="녹음 인증"
            className="check-in-page__profile"
          />
          <p className="check-in-page__room">{room.roomName}</p>
          <div className="check-in-page__panel">
            <div className="check-in-page__visual" aria-hidden="true">
              {isRecording ? '🎙️ 녹음 중…' : '🎙️ 녹음 준비'}
            </div>
            <button
              type="button"
              className={`check-in-page__record-btn ${isRecording ? 'check-in-page__record-btn--active' : ''}`}
              onClick={handleToggleRecording}
            >
              {isRecording ? '녹음 정지' : '녹음 시작'}
            </button>
            <p className="check-in-page__hint">
              실제 마이크 녹음은 추후 구현됩니다. MVP mock에서는 녹음 상태만 시뮬레이션합니다.
            </p>
          </div>

          <button
            type="button"
            className="check-in-page__submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '전송 중…' : '인증 전송'}
          </button>

          {error && <p className="check-in-page__error" role="alert">{error}</p>}
        </div>
      </PageContainer>
    </AppShell>
  );
}
