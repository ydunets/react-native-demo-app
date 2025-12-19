---
applyTo: "store/**/*.ts"
description: "Instructions for Zustand state management stores"
name: "state-management"
---

# State Management Guidelines

Follow these patterns when working with Zustand stores in `store/`.

## Configuration
- **Persistence**: Use `persist` middleware with `createMMKV` storage.
- **Immutability**: Zustand updates should be immutable.
- **Separation**: Define `State` and `Actions` interfaces separately.

## Store Template

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { envConfig } from '@/configs/env-config';

// 1. Setup MMKV Storage
const mmkvStorage = createMMKV({
  id: 'store-id',
  encryptionKey: envConfig.mmkvEncryptionKey,
});

const mmkvStorageAdapter = createJSONStorage(() => ({
  getItem: (key) => mmkvStorage.getString(key) || null,
  setItem: (key, value) => mmkvStorage.set(key, value),
  removeItem: (key) => mmkvStorage.remove(key),
}));

// 2. Define Types
interface MyState {
  count: number;
}

interface MyActions {
  increment: () => void;
  reset: () => void;
}

// 3. Create Store
export const useMyStore = create<MyState & MyActions>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ count: 0 }),
    }),
    {
      name: 'my-store-storage',
      storage: mmkvStorageAdapter,
    }
  )
);
```

## Best Practices
- **Selectors**: Export selectors if specific state slices are frequently used.
- **Actions**: Co-locate actions with state in the store definition.
- **Reset**: Always provide a way to reset state (useful for logout).
