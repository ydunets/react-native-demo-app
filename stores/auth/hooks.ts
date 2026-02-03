import { useAuthStore } from './authStore';
import {
  selectAuthActions,
  selectTokens,
  selectUser,
  selectIsLoggedIn,
  selectIsHydrated,
} from './selectors';
import type { AuthStore } from './types';

export const useAuthActions = (): AuthStore['actions'] =>
  useAuthStore(selectAuthActions);

export const useIsLoggedIn = (): boolean =>
  useAuthStore(selectIsLoggedIn);

export const useUser = (): AuthStore['user'] =>
  useAuthStore(selectUser);

export const useTokens = (): AuthStore['tokens'] =>
  useAuthStore(selectTokens);

export const useIsHydrated = (): boolean =>
  useAuthStore(selectIsHydrated);
