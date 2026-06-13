import { useCallback, useMemo, useState } from 'react';
import { AuthContext } from '@/hooks/useAuth.js';
import {
  STORAGE_KEY,
  findOrCreateMember,
  getMemberById,
} from '@/mocks/index.js';

function readStoredMember() {
  const storedId = localStorage.getItem(STORAGE_KEY);
  if (!storedId) return null;

  const parsed = getMemberById(Number(storedId));
  if (parsed) return { ...parsed };

  localStorage.removeItem(STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [member, setMember] = useState(readStoredMember);

  const login = useCallback(async ({ kakaoId, name, profileImg = null }) => {
    const loggedIn = findOrCreateMember({ kakaoId, name, profileImg });
    const fresh = getMemberById(loggedIn.memberId) ?? loggedIn;
    localStorage.setItem(STORAGE_KEY, String(fresh.memberId));
    setMember(fresh);
    return fresh;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMember(null);
  }, []);

  const value = useMemo(
    () => ({
      member,
      isAuthenticated: Boolean(member),
      isLoading: false,
      login,
      logout,
    }),
    [member, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
