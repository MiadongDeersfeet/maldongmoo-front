import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import MemberProfileStrip from '@/components/ui/MemberProfileStrip.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { joinRoom } from '@/api/roomApi.js';
import { ApiError } from '@/api/apiClient.js';
import './RoomFormPage.css';

function getSubmitErrorMessage(error, fallback) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) {
      setError('초대코드 8자리를 입력해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await joinRoom(code);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(getSubmitErrorMessage(err, '입장에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="초대코드 입장" showBack member={member}>
      <PageContainer>
        <MemberProfileStrip
          name={member.name}
          profileImg={member.profileImg}
          subtitle="초대코드로 입장"
          className="room-form-page__profile"
        />
        <form className="room-form" onSubmit={handleSubmit}>
          <p className="room-form__intro">
            방장에게 받은 8자리 초대코드를 입력해 주세요.
          </p>

          <div className="room-form__field">
            <label htmlFor="inviteCode">초대코드</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="A7K9Q2MX"
              autoComplete="off"
              spellCheck={false}
              className="room-form__invite-input"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="room-form__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '입장 중...' : '입장하기'}
          </button>

          {error && (
            <p className="room-form__error" role="alert">
              {error}
            </p>
          )}
        </form>
      </PageContainer>
    </AppShell>
  );
}
