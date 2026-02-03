---
applyTo: "stores/**/*.ts"
description: "Instructions for Zustand state management stores following zustand-bp patterns"
name: "state-management"
---

# Zustand State Management Guidelines

Follow these patterns when working with Zustand stores in `stores/`.

## Architecture: Feature Folder Pattern

Each store is a feature folder with separated concerns:

```
stores/
  _shared/
    mmkvStorage.ts          # Shared MMKV adapter factory
  <feature>/
    types.ts                # State, Actions, Store interfaces
    selectors.ts            # Pure selector functions
    <feature>Store.ts       # Store definition with actions object
    hooks.ts                # Semantic React hooks wrapping selectors
    index.ts                # Barrel re-exports
```

## 1. Types (`types.ts`)

Separate State, Actions, and Store into distinct interfaces. The Store type combines State with a nested `actions` object:

```typescript
export interface MyState {
  items: Item[];
  isLoading: boolean;
}

export interface MyActions {
  addItem: (item: Item) => void;
  reset: () => void;
}

export type MyStore = MyState & { actions: MyActions };
```

## 2. Store Definition (`<feature>Store.ts`)

All actions live under an `actions` key, not at the root level. This keeps state and behavior separated and enables excluding actions from persistence:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorageAdapter } from '../_shared/mmkvStorage';
import type { MyStore, Item } from './types';

const mmkvStorageAdapter = createMMKVStorageAdapter('my-storage');

export const useMyStore = create<MyStore>()(
  persist(
    (set, get) => ({
      // --- State ---
      items: [],
      isLoading: false,

      // --- Actions ---
      actions: {
        addItem: (item: Item) => {
          set((state) => ({ items: [...state.items, item] }));
        },
        reset: () => {
          set({ items: [], isLoading: false });
        },
      },
    }),
    {
      name: 'my-storage',
      storage: mmkvStorageAdapter,
      partialize: (state) => ({
        items: state.items,
        // IMPORTANT: never persist `actions` — they are functions
      }),
    }
  )
);
```

## 3. Selectors (`selectors.ts`)

Pure functions that extract or derive values from state. Used by hooks and for `getState()` calls:

```typescript
import type { MyStore } from './types';

export const selectActions = (state: MyStore) => state.actions;
export const selectItems = (state: MyStore) => state.items;
export const selectIsLoading = (state: MyStore) => state.isLoading;
export const selectItemCount = (state: MyStore) => state.items.length;
```

Rules:
- Selectors that create new objects (e.g., `new Set(...)`) must only be used with `getState()`, never as reactive selectors, because Zustand's equality check (`Object.is`) would trigger re-renders on every state change.
- Curried selectors are allowed for parameterized lookups: `export const selectItemById = (id: string) => (state: MyStore) => state.items.find(i => i.id === id);`

## 4. Hooks (`hooks.ts`)

Thin wrappers that connect selectors to the store hook. Components use these instead of calling `useMyStore` directly:

```typescript
import { useMyStore } from './myStore';
import { selectActions, selectItems, selectIsLoading } from './selectors';
import type { MyStore } from './types';

export const useMyActions = (): MyStore['actions'] =>
  useMyStore(selectActions);

export const useItems = (): MyStore['items'] =>
  useMyStore(selectItems);

export const useIsLoading = (): boolean =>
  useMyStore(selectIsLoading);
```

The `useMyActions()` hook returns a stable reference (the `actions` object is created once), so components using only actions will not re-render on state changes.

## 5. Barrel Exports (`index.ts`)

Re-export everything for clean imports:

```typescript
export { useMyStore } from './myStore';
export { useMyActions, useItems, useIsLoading } from './hooks';
export { selectActions, selectItems, selectIsLoading, selectItemCount } from './selectors';
export type { MyState, MyActions, MyStore, Item } from './types';
```

Consumers import from the barrel: `import { useItems, useMyActions } from '@/stores/my';`

## 6. Shared MMKV Adapter (`_shared/mmkvStorage.ts`)

Use the shared factory for all persisted stores. Do not duplicate MMKV setup:

```typescript
import { createMMKVStorageAdapter } from '../_shared/mmkvStorage';
const adapter = createMMKVStorageAdapter('unique-storage-id');
```

## Key Rules

- **Actions object pattern**: Always nest actions under `actions` key
- **Never persist actions**: `partialize` must exclude the `actions` object
- **Selectors for derived data**: Move helper methods (e.g., `getTotalCount()`) out of the store and into `selectors.ts` as pure functions
- **Hooks for components**: Components use semantic hooks (`useItems()`) not raw `useMyStore(selector)`
- **`getState()` for non-React code**: Axios interceptors, callbacks, and effects that need imperative access use `useMyStore.getState()`. Access actions via `useMyStore.getState().actions.doSomething()`
- **MMKV storage keys must stay stable**: Changing a storage key or MMKV instance ID will lose persisted data
- **Immutable updates**: Zustand `set()` calls must return new objects, not mutate existing state
