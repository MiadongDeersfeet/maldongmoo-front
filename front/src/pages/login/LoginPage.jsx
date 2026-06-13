import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { seedMembers } from '@/mocks/data/members.js';
import './LoginPage.css';
const MOCK_PROFILES = seedMembers.filter((m) => m.status === 'Y').slice(0, 3);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleMockLogin = async (profile) => {
    setError('');
    try {
      await login({
        kakaoId: profile.kakaoId,
        name: profile.name,
        profileImg: profile.profileImg,
      });
      navigate('/home', { replace: true });
    } catch {
      setError('로그인에 실패했습니다.');
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('실명을 입력해 주세요.');
      return;
    }
    setError('');
    try {
      await login({
        kakaoId: `kakao_mock_${Date.now()}`,
        name: name.trim(),
        profileImg: null,
      });
      navigate('/home', { replace: true });
    } catch {
      setError('로그인에 실패했습니다.');
    }
  };

  return (
    <AppShell title="로그인">
      <PageContainer>
        <div className="login-page">
          <p className="login-page__intro">
            카카오 로그인 후 앱에서 사용할 실명을 확인합니다.
          </p>

          <div className="login-page__profiles">
            {MOCK_PROFILES.map((profile) => (
              <button
                key={profile.kakaoId}
                type="button"
                className="login-page__profile-btn"
                onClick={() => handleMockLogin(profile)}
              >
                <AvatarCircle
                  name={profile.name}
                  profileImg={profile.profileImg}
                  size="sm"
                  className="login-page__profile-avatar"
                />
                <span>{profile.name}으로 시작</span>
              </button>
            ))}
          </div>

          <div className="login-page__divider">
            <span>또는</span>
          </div>

          <form className="login-page__form" onSubmit={handleCustomLogin}>
            <label htmlFor="name">실명</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="앱에서 사용할 이름"
              maxLength={20}
            />
            <button type="submit" className="login-page__submit">
              이름으로 시작 (신규)
            </button>
          </form>

          {error && <p className="login-page__error" role="alert">{error}</p>}

          <p className="login-page__notice">MVP mock 로그인 · 실제 카카오 OAuth 미연결</p>
        </div>
      </PageContainer>
    </AppShell>
  );
}
