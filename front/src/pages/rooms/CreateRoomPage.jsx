import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import MemberProfileStrip from '@/components/ui/MemberProfileStrip.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { createRoom } from '@/api/roomApi.js';
import { ApiError } from '@/api/apiClient.js';
import './RoomFormPage.css';

const MEMBER_LIMIT_OPTIONS = [5, 10, 15, 20];

function getSubmitErrorMessage(error, fallback) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [memberLimit, setMemberLimit] = useState(10);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!roomName.trim()) {
      setError('암송방 이름을 입력해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await createRoom({
        roomName: roomName.trim(),
        memberLimit,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(getSubmitErrorMessage(err, '암송방 생성에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="암송방 만들기" showBack member={member}>
      <PageContainer>
        <div className="room-form-page">
          <MemberProfileStrip
            name={member.name}
            profileImg={member.profileImg}
            subtitle="방장으로 생성"
            className="room-form-page__profile"
          />
          <p className="room-form-page__intro">
            새 암송방을 만들고 함께할 멤버를 초대해 보세요.
          </p>

          <form className="room-form room-form--card" onSubmit={handleSubmit}>
            <div className="room-form__field">
              <label htmlFor="roomName">암송방 이름</label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="예: 요한복음 암송방"
                maxLength={40}
                disabled={isSubmitting}
              />
            </div>

            <div className="room-form__field">
              <label htmlFor="memberLimit">방 정원</label>
              <select
                id="memberLimit"
                value={memberLimit}
                onChange={(e) => setMemberLimit(Number(e.target.value))}
                disabled={isSubmitting}
              >
                {MEMBER_LIMIT_OPTIONS.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}명
                  </option>
                ))}
              </select>
            </div>

            <p className="room-form__notice">
              암송 본문은 방을 만든 후 방 상세 화면에서 등록할 수 있어요.
            </p>

            <button
              type="submit"
              className="room-form__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '만드는 중...' : '암송방 만들기'}
            </button>

            {error && (
              <p className="room-form__error" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
      </PageContainer>
    </AppShell>
  );
}
