// FILE 2: store/authStore.tsx
/**
 * Authentication State Management Store
 * Manages tokens, user information, and authentication state using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { jwtDecode } from 'jwt-decode';
import { envConfig } from '@/configs/env-config';
import { logoutFromKeycloak } from '@/api/keycloak-integration/keycloakLogout';

/**
 * MMKV storage instance for encrypted persistence
 */
const mmkvStorage = createMMKV({
  id: 'auth-storage',
  encryptionKey: envConfig.mmkvEncryptionKey,
});

/**
 * Storage adapter for Zustand persist with MMKV
 */
const mmkvStorageAdapter = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = mmkvStorage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string) => {
    mmkvStorage.remove(key);
  },
}));

/**
 * Decoded JWT token type
 */
interface DecodedToken {
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

/**
 * Authentication tokens
 */
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Auth store state interface
 */
interface AuthState {
  // State
  tokens: AuthTokens | null;
  user: UserProfile | null;
  isLoggedIn: boolean;
  isHydrated: boolean;

  // Actions
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  /**
   * Logout via Keycloak - invalidates session on server
   */
  logoutFromKeycloak: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
}

/**
 * Auth store hook using Zustand with persistence
 * Stores auth state securely using expo-secure-store
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      isLoggedIn: false,
      isHydrated: false,

      setTokens: (tokens: AuthTokens) => {
        try {
          const decoded = jwtDecode<DecodedToken>(tokens.accessToken);
          const user: UserProfile = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
          };

          set({
            tokens,
            user,
            isLoggedIn: true,
          });
        } catch (error) {
          console.error('Error decoding access token:', error);
          set({ tokens: null, isLoggedIn: false });
        }
      },

      setUser: (user: UserProfile) => {
        set({ user });
      },

      logout: () => {
        set({
          tokens: null,
          user: null,
          isLoggedIn: false,
        });
      },

      clearAuth: () => {
        set({
          tokens: null,
          user: null,
          isLoggedIn: false,
        });
      },

      updateTokens: (tokens: AuthTokens) => {
        try {
          const decoded = jwtDecode<DecodedToken>(tokens.accessToken);
          set((state) => ({
            tokens,
            user: state.user ? { ...state.user, decodedToken: decoded } : null,
          }));
        } catch (error) {
          console.error('Error updating tokens:', error);
        }
      },

      /**
       * Logout via Keycloak - invalidates session on server
       */
      logoutFromKeycloak: async () => {
        try {
          await logoutFromKeycloak();

          set({
            tokens: null,
            user: null,
            isLoggedIn: false,
          });

          console.log('Logged out from Keycloak');
        } catch (error) {
          console.error('Error logging out from Keycloak:', error);
          set({
            tokens: null,
            user: null,
            isLoggedIn: false,
          });
        }
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'auth-storage',
      storage: mmkvStorageAdapter,
      partialize: (state) => ({
        tokens: state.tokens,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hasTokens = !!state.tokens?.accessToken && !!state.tokens?.refreshToken;
          state.isLoggedIn = hasTokens;
          state.isHydrated = true;
          console.log('✅ Store hydrated from MMKV - isLoggedIn:', hasTokens);
        }
      },
    }
  )
);
