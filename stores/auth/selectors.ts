import type { AuthStore } from './types';

export const selectAuthActions = (state: AuthStore) => state.actions;

export const selectTokens = (state: AuthStore) => state.tokens;

export const selectUser = (state: AuthStore) => state.user;

export const selectIsLoggedIn = (state: AuthStore) => state.isLoggedIn;

export const selectIsHydrated = (state: AuthStore) => state.isHydrated;

export const selectAccessToken = (state: AuthStore) =>
  state.tokens?.accessToken ?? null;
