/**
 * Base64 decode function compatible with React Native
 */
function base64Decode(str: string): string {
  // Add padding if needed
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str + padding;
  
  // Use atob for base64 decoding (available in React Native)
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    throw new Error('Invalid base64 string');
  }
}

export function jwtDecode(token: string): { [key: string]: any } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = base64Decode(base64);
  return JSON.parse(jsonPayload);
}