import { useCallback, useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { JwtPayload } from 'jwt-decode';

async function generateRandomHexString(length: number): Promise<string> {
  // Generate random bytes as a Base64 string
  const randomBytesBase64 = await Crypto.getRandomBytesAsync(length / 2);
  
  // Convert Base64 bytes to a hex string
  // You may need a polyfill for Buffer in Expo apps if you don't have one already
  return Buffer.from(randomBytesBase64).toString('hex');
}

export function jwtDecode(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(jsonPayload) as JwtPayload & { nonce?: string };
}


/**
 * useNonce hook for managing a cryptographic nonce.
 * - Generates a new nonce using generateHexStringAsync
 * - Stores the nonce in state
 * - Provides a function to regenerate the nonce
 */
export function useNonce(initialLength: number = 32) {
  const [nonce, setNonce] = useState<string>('');

  const generateNonce = useCallback(async (length: number = initialLength) => {
    const newNonce = await generateRandomHexString(length);
    setNonce(newNonce);
    return newNonce;
  }, [initialLength]);

  const validateNonce = useCallback((idToken: string) => {
    if (!idToken) return false;

    try {
      const payload = jwtDecode(idToken);

      console.log(
        "Nonce verified",
        payload.nonce === nonce ? "(match)" : "(mismatch)",
      );
      
      return !!payload.nonce && payload.nonce === nonce;
    } catch {
      throw new Error("Invalid ID token");
    }
  }, [nonce]);

  useEffect(() => {
    // Generate the initial nonce when the hook is first used
    generateNonce();
  }, [generateNonce]);

  return { nonce, generateNonce, validateNonce };
}
