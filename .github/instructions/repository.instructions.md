---
applyTo: "**/*"
description: "Instructions for developers working on the Expo App Presentation repository, covering architecture, conventions, and common tasks."
name: "expo-app-presentation-repo-instructions"
---

# Copilot Instructions for Expo App Presentation

## Quick Start
- **Framework**: React Native (Expo) with Expo Router for file-based routing
- **Language**: TypeScript with strict mode enabled
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand (in `store/store.ts`)
- **Dev Commands**: `npm start` (dev), `npm run ios` / `npm run android`, `npm run lint`, `npm run format`

## Architecture Overview

### Routing Structure (Expo Router)
The app uses **file-based routing with route groups**:
- **`(auth)`** - Authentication screens (login, register, welcome) - no headers
- **`(main)`** - Authenticated user screens with tab navigation
- **`index.tsx`** - Root entry point that redirects to home screen
- **Route paths** are centralized in `router-map/routes.tsx` (use the `RoutePaths` enum)

See `technical/en/routing-structure.md` for detailed routing patterns.

### Component Architecture
- **Root Layout** (`app/_layout.tsx`) - Wraps entire app with providers:
  - `SafeAreaProvider` - handles safe areas
  - `GestureHandlerRootView` - gesture support
  - `ActionSheetProvider` - bottom sheets
  - `NavThemeProvider` - navigation theming
- **Custom Components** in `components/nativewindui/` use **class-variance-authority (CVA)** for variants (see `Button.tsx` pattern)
- **All UI components accept `className` prop** using NativeWind syntax

### Theming & Colors
- **Theme provider**: `useColorScheme()` hook in `lib/useColorScheme.tsx` manages light/dark modes
- **Colors**: Defined in `theme/colors.ts` with iOS system colors as base
- **Navigation theme**: `NAV_THEME` in `theme/index.ts` maps colors to React Navigation
- **Tailwind config**: `darkMode: 'class'` enables manual toggling
- **Color with opacity helper**: `withOpacity()` function supports dynamic opacity (see `theme/with-opacity.ts`)

### State Management
- **Zustand store** in `store/store.ts` - example has bear counter state
- Pattern: `useStore()` hook returns state + actions
- Keep stores focused and co-locate with features when possible

## Key Developer Conventions

### File Organization
```
/app/          - Screen components (Expo Router pages)
/components/   - Reusable UI components (NativeWind + CVA pattern)
/lib/          - Utilities (cn, useColorScheme, color helpers)
/theme/        - Design tokens, colors, navigation theme
/store/        - Zustand state
/router-map/   - Route path constants
```

### Component Patterns
1. **Use NativeWind classes** for styling - all pressables/views accept `className`
2. **CVA for variants** - see Button.tsx example with `buttonVariants` and `buttonTextVariants`
3. **Merge classnames** with `cn()` utility from `lib/cn.ts` (clsx + tailwind-merge)
4. **Color scheme awareness** - use `useColorScheme()` hook for conditional colors
5. **Platform-specific styles** - use `ios:` and `android:` prefixes in Tailwind classes

### Navigation
- Reference routes using `RoutePaths` enum from `router-map/routes.tsx`
- Use `href` prop for navigation (Expo Router's type-safe linking)
- Stacks have `headerShown: false` - build custom headers in components
- Auth flow: entry point redirects authenticated users to `(main)`, unauthenticated to `(auth)`

### Styling Rules
- Import `global.css` at root (`app/_layout.tsx`)
- Color references use `COLORS` from `theme/colors.ts` or Tailwind class names
- Dark mode: use `dark:` prefix for dark mode specific classes
- Responsive: use Expo Router patterns (avoid CSS media queries)
- For advanced colors with opacity: use `withOpacity('colorName')` in config

## Common Tasks

### Creating a New Screen
1. Add file in `app/(section)/screen-name.tsx`
2. Wrap with route group layout if needed
3. Use `useColorScheme()` for theme-aware components
4. Import and use custom UI components from `components/nativewindui/`

### Adding a UI Component
1. Create in `components/nativewindui/Component.tsx`
2. Use CVA pattern for variants (see Button.tsx)
3. Accept `className` prop and merge with `cn()`
4. Export types and component

### Updating State
1. Add actions to Zustand store in `store/store.ts`
2. Use `useStore()` hook in components
3. State updates are immutable within Zustand

## Important Notes
- **TypeScript paths**: `@/*` resolves from root (configured in `tsconfig.json`)
- **Safe area**: Wrapped at root level - use spacing on screens
- **Linting**: ESLint extends `eslint-config-expo` - run `npm run format` before commits
- **No hard-coded colors** - always use theme values from `COLORS` or Tailwind
- **Assets**: Placed in `/assets/` and referenced via imports
