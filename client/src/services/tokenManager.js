const TOKEN_KEY = 'token';

function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const tokenManager = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isExpired(token) {
    const payload = parseJwtPayload(token);
    if (!payload?.exp) return true;
    // 10-second grace buffer to account for clock skew
    return payload.exp * 1000 < Date.now() + 10_000;
  },

  isValid(token) {
    if (!token) return false;
    return !this.isExpired(token);
  },

  getPayload(token) {
    return parseJwtPayload(token ?? this.get());
  },
};

export default tokenManager;
