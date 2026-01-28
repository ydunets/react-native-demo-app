export interface DecodedToken {
  sub: string;
  email?: string;
  name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: UserProfile | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
}

export interface AuthActions {
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  logoutFromKeycloak: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

export type AuthStore = AuthState & { actions: AuthActions };
