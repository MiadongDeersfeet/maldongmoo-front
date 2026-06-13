import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import MemberProfileStrip from '@/components/ui/MemberProfileStrip.jsx';
import { useAuth } from '@/hooks/useAuth.js';import { getRoomById, submitCounterCheckIn } from '@/mocks/index.js';
import './CheckInPage.css';

export default function CounterCheckInPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { member } = useAuth();
  const numericRoomId = Number(roomId);
  const room = getRoomById(numericRoomId);

  const [counterValue, setCounterValue] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDecrease = () => {
    setCounterValue((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setCounterValue((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      submitCounterCheckIn(numericRoomId, member.memberId, counterValue);
      navigate(`/rooms/${roomId}`, { replace: true });
    } catch {
      setError('인증 전송에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  if (!room) {
    return (
      <AppShell title="계수기 인증" showBack>
        <PageContainer>
          <div className="page-placeholder">
            <h1>방을 찾을 수 없습니다</h1>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="계수기 인증" showBack member={member}>
      <PageContainer>
        <div className="check-in-page">
          <MemberProfileStrip
            name={member.name}
            profileImg={member.profileImg}
            subtitle="계수기 인증"
            className="check-in-page__profile"
          />
          <p className="check-in-page__room">{room.roomName}</p>
          <div className="check-in-page__panel">
            <p className="check-in-page__label">오늘 암송 횟수</p>
            <div className="check-in-page__counter">
              <button
                type="button"
                className="check-in-page__counter-btn"
                onClick={handleDecrease}
                aria-label="횟수 줄이기"
              >
                −
              </button>
              <span className="check-in-page__counter-value">{counterValue}</span>
              <button
                type="button"
                className="check-in-page__counter-btn"
                onClick={handleIncrease}
                aria-label="횟수 늘리기"
              >
                +
              </button>
            </div>
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
