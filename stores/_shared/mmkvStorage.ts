import { createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { envConfig } from '@/configs/env-config';

export const createMMKVStorageAdapter = (storageId: string) => {
  const mmkvStorage = createMMKV({
    id: storageId,
    encryptionKey: envConfig.mmkvEncryptionKey,
  });

  return createJSONStorage(() => ({
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
};
