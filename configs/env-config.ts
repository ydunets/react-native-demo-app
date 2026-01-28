/**
 * Environment Configuration
 * Centralized configuration for all environment-specific values
 * Follows constitution: Type-Safe Navigation (centralized URL configuration)
 */

import { Platform } from 'react-native';

/**
 * Detect current platform
 * Used for platform-specific URL selection (iOS vs Android)
 */
const isAndroid = Platform.OS === 'android';

/**
 * Get the host address for reaching the host machine from the emulator/simulator
 *
 * - iOS Simulator: Mac's IP address (localhost doesn't work)
 * - Android Emulator: 10.0.2.2 (special alias to host machine)
 * - Production: localhost (overridden by env vars)
 */
const getHostAddress = (): string => {
  if (isAndroid) {
    return '10.0.2.2';
  }
  // iOS Simulator needs Mac's IP address
  return '192.168.100.2';
};

const getFileServerBaseURL = (): string => {
  // Production/explicit configuration takes precedence
  if (process.env.EXPO_PUBLIC_FILE_SERVER_URL) {
    return process.env.EXPO_PUBLIC_FILE_SERVER_URL;
  }

  return `http://${getHostAddress()}:3001`;
};

/**
 * Get API base URL
 * Different for iOS Simulator, Android Emulator, and production
 *
 * @returns Base URL for backend API
 */

export const envConfig = {
  // Keycloak server URL (no trailing slash)
  keycloakURL: 'http://localhost:8080',

  // Keycloak realm name
  realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'expo-app-realm',

  // OAuth 2.0 Client ID
  clientId: process.env.EXPO_PUBLIC_CLIENT_ID || 'expo-app',

  // API base URL for backend services
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || `http://${getHostAddress()}:3001/api`,

  // File server base URL for attachment downloads
  fileServerBaseURL: getFileServerBaseURL(),

  // MMKV encryption key for secure storage (32 characters)
  mmkvEncryptionKey: process.env.MMKV_ENCRYPTION_KEY || 'your-32-character-encryption-key',
};
