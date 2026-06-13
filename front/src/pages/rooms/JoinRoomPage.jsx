import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import MemberProfileStrip from '@/components/ui/MemberProfileStrip.jsx';
import { useAuth } from '@/hooks/useAuth.js';import { joinRoom } from '@/mocks/index.js';
import './RoomFormPage.css';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('초대코드는 6자리입니다.');
      return;
    }

    setError('');
    try {
      const room = joinRoom(code, member.memberId);
      navigate(`/rooms/${room.roomId}`, { replace: true });
    } catch (err) {
      setError(err.message || '입장에 실패했습니다.');
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
        <form className="room-form" onSubmit={handleSubmit}>          <p className="room-form__intro">
            방장에게 받은 6자리 초대코드를 입력해 주세요.
          </p>

          <div className="room-form__field">
            <label htmlFor="inviteCode">초대코드</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="A7K3P9"
              autoComplete="off"
              spellCheck={false}
              className="room-form__invite-input"
            />
          </div>

          <button type="submit" className="room-form__submit">
            입장하기
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
