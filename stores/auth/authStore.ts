import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { logoutFromKeycloak } from '@/api/keycloak-integration/keycloakLogout';
import { createMMKVStorageAdapter } from '../_shared/mmkvStorage';
import type { AuthStore, AuthTokens, DecodedToken, UserProfile } from './types';

const mmkvStorageAdapter = createMMKVStorageAdapter('auth-storage');

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      isLoggedIn: false,
      isHydrated: false,

      actions: {
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
            jwtDecode<DecodedToken>(tokens.accessToken);
            set((state) => ({
              tokens,
              user: state.user,
            }));
          } catch (error) {
            console.error('Error updating tokens:', error);
          }
        },

        logoutFromKeycloak: async () => {
          try {
            const refreshToken = get().tokens?.refreshToken;

            await logoutFromKeycloak({ refreshToken });

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
          state.isLoggedIn = !!state.tokens?.accessToken && !!state.tokens?.refreshToken;
          state.isHydrated = true;
        }
      },
    }
  )
);
