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
 * Get file server base URL
 * Different for iOS Simulator, Android Emulator, and production
 *
 * - iOS Simulator: localhost:3001 (host machine port forwarding)
 * - Android Emulator: 10.0.2.2:3001 (special alias to host machine)
 * - Production: EXPO_PUBLIC_FILE_SERVER_URL environment variable
 *
 * @returns Base URL for file server API (without trailing slash)
 */
const getFileServerBaseURL = (): string => {
  // Production/explicit configuration takes precedence
  if (process.env.EXPO_PUBLIC_FILE_SERVER_URL) {
    return process.env.EXPO_PUBLIC_FILE_SERVER_URL;
  }

  // Android Emulator uses 10.0.2.2 to reach host machine
  if (isAndroid) {
    return 'http://10.0.2.2:3001';
  }

  // iOS Simulator can use localhost
  return 'http://localhost:3001';
};

export const envConfig = {
  // Keycloak server URL (no trailing slash)
  keycloakURL: process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  
  // Keycloak realm name
  realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'expo-app-realm',
  
  // OAuth 2.0 Client ID
  clientId: process.env.EXPO_PUBLIC_CLIENT_ID || 'expo-app',
  
  // API base URL for backend services
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',

  // File server base URL for attachment downloads
  fileServerBaseURL: getFileServerBaseURL(),

  // MMKV encryption key for secure storage (32 characters)
  mmkvEncryptionKey: process.env.MMKV_ENCRYPTION_KEY || 'your-32-character-encryption-key',
};