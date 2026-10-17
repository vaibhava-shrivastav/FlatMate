import { createContext, useState, useEffect, useCallback } from 'react';
import tokenManager from '@services/tokenManager';
import authService from '@services/authService';
import { connectSocket, disconnectSocket } from '@services/socket';
import { getRolePermissions, hasPermission, isAdmin } from '@utils/authHelpers';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const permissions = getRolePermissions(role);

  // ─── Session restore on mount ────────────────────────────────────────────
  useEffect(() => {
    const token = tokenManager.get();

    if (!token || !tokenManager.isValid(token)) {
      tokenManager.remove();
      setIsLoading(false);
      return;
    }

    authService
      .getCurrentUser()
      .then((userData) => {
        setUser(userData);
        try {
          connectSocket(token);
        } catch (socketErr) {
          console.error('[AuthContext] Socket connection failed, continuing without real-time:', socketErr);
        }
      })
      .catch(() => {
        tokenManager.remove();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────
  // Accepts { user, token } returned directly from authService to avoid a duplicate /users/me call.
  const login = useCallback((userData, token) => {
    tokenManager.set(token);
    setUser(userData);
    try {
      connectSocket(token);
    } catch (socketErr) {
      console.error('[AuthContext] Socket connection failed after login, continuing without real-time:', socketErr);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    tokenManager.remove();
    setUser(null);
    disconnectSocket();
  }, []);

  // Accepts { user, token } returned directly from authService to avoid a duplicate /users/me call.
  const register = useCallback((userData, token) => {
    tokenManager.set(token);
    setUser(userData);
    try {
      connectSocket(token);
    } catch (socketErr) {
      console.error('[AuthContext] Socket connection failed after register, continuing without real-time:', socketErr);
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.refreshProfile();
      setUser(userData);
    } catch (err) {
      console.error('[AuthContext] refreshUser failed, keeping existing user state:', err);
    }
  }, []);

  const can = useCallback(
    (permission) => hasPermission(role, permission),
    [role]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        role,
        permissions,
        isAdmin: isAdmin(role),
        login,
        logout,
        register,
        updateUser,
        refreshUser,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
