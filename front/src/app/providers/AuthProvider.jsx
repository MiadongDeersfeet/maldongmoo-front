import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '@/hooks/useAuth.js';
import { getMe, logout as logoutApi } from '@/api/authApi.js';
import { ApiError } from '@/api/apiClient.js';
import {
  findOrCreateMember,
  getMemberById,
} from '@/mocks/index.js';

/**
 * Maps backend /api/me fields to the member shape used across the UI.
 * @param {import('@/api/authApi.js').MeResponse | null | undefined} me
 */
function mapMeToMember(me) {
  if (!me?.memberId) {
    return null;
  }

  return {
    memberId: me.memberId,
    name: me.memberName,
    profileImg: me.profileImageUrl,
    role: me.role,
  };
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const refreshSession = useCallback(async () => {
    setAuthError(null);

    try {
      const me = await getMe();
      const nextMember = mapMeToMember(me);
      setMember(nextMember);
      return nextMember;
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        setMember(null);
        return null;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : '로그인 정보를 불러오지 못했습니다.';
      setAuthError(message);
      setMember(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    refreshSession()
      .catch(() => {
        // 401 is a normal guest state; other errors are stored in authError.
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  /**
   * Mock-only login for pages not yet migrated to real API (e.g. NameEntryPage).
   * Does not create a server session.
   */
  const login = useCallback(async ({ kakaoId, name, profileImg = null }) => {
    const loggedIn = findOrCreateMember({ kakaoId, name, profileImg });
    const fresh = getMemberById(loggedIn.memberId) ?? loggedIn;
    setMember({ ...fresh });
    return fresh;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      if (!(error instanceof ApiError && error.isUnauthorized)) {
        console.warn('[auth] logout failed:', error);
      }
    } finally {
      setMember(null);
      setAuthError(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      member,
      isAuthenticated: Boolean(member),
      isLoading,
      authError,
      refreshSession,
      login,
      logout,
    }),
    [member, isLoading, authError, refreshSession, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
