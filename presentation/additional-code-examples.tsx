/**
 * Digest a random string with hex encoding, useful for creating `nonce`s.
 */

function convertBufferToString(buffer: Uint8Array): string {
  const state: string[] = [];
  for (let i = 0; i < buffer.byteLength; i += 1) {
    const index = buffer[i] % CHARSET.length;
    state.push(CHARSET[index]);
  }
  return state.join("");
}

export async function generateHexStringAsync(size: number): Promise<string> {
  const value = generateRandom(size);
  const buffer = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
    {
      encoding: Crypto.CryptoEncoding.HEX
    }
  );
  return convertToUrlSafeString(buffer);
}

/**
 * Expo Auth Session - Expo SDK 53
 * 
 * Фреймворк, упрощающий разработку с React Native:
 * 
 * ✅ Over-the-air обновления без пересборки приложения
 * ✅ Встроенная поддержка OAuth 2.0 и OpenID Connect
 * ✅ Безопасное сохранение токенов и учетных данных
 * ✅ Автоматическое управление сессией и рефреш токенов
 * ✅ Поддержка различных провайдеров (Google, GitHub, Facebook и т.д.)
 * ✅ Работает как на iOS, так и на Android
 * ✅ Простой API для управления аутентификацией
 * ✅ Нативная поддержка веб-сессий через CustomTabs (Android) и SFSafariViewController (iOS)
 * 
 * Основные компоненты:
 * - useAuthRequest: Hook для инициирования OAuth запроса
 * - useAuthRequestResult: Hook для обработки результата аутентификации
export const expoAuthSessionInfo = {
  version: "53.0.0",
  features: [
    "OAuth 2.0",
    "OpenID Connect",
    "Token Management",
    "Session Management",
    "Auto Refresh Tokens"
  ]
};
