export const envConfig = {
  // Keycloak server URL (no trailing slash)
  keycloakURL: process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  
  // Keycloak realm name
  realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'expo-app-realm',
  
  // OAuth 2.0 Client ID
  clientId: process.env.EXPO_PUBLIC_CLIENT_ID || 'expo-app',
  
  // API base URL for backend services
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',

  // MMKV encryption key for secure storage (32 characters)
  mmkvEncryptionKey: process.env.MMKV_ENCRYPTION_KEY || 'your-32-character-encryption-key',
};