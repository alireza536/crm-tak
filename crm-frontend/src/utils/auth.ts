export type UserRole = "ADMIN" | "SALES";

export type AuthUser = {
  id: number;
  name: string;
  role: UserRole;
};

type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

const SESSION_KEY = "tak-crm-session";

export function saveSession(accessToken: string, user: AuthUser) {
  const session: AuthSession = { accessToken, user };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem("token");
}

export function getSession(): AuthSession | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    if (!session.accessToken || !session.user?.id || !session.user?.role) return null;
    return session;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null;
}

export function getCurrentUser() {
  return getSession()?.user ?? null;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("token");
}
