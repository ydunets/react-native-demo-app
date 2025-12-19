# Expo App Presentation

Modern, cross-platform mobile app using React Native (Expo) with a focus on modularity, theming, and robust authentication.

## Tech Stack
- **React Native (Expo)**: 54.x
- **TypeScript**: 5.9+ (strict mode)
- **Expo Router**: 6.x (file-based navigation)
- **NativeWind**: Tailwind CSS for React Native
- **Zustand**: 4.5+ (state management)
- **React Query**: 5.x (server state)
- **Keycloak OAuth**: Authentication via `expo-auth-session`
- **Axios**: API client with interceptors
- **MMKV**: Encrypted local storage

## Architecture
- **Feature-based structure**: Screens in `app/`, reusable UI in `components/nativewindui/`, state in `store/`
- **Expo Router**: Route groups (`(auth)`, `(main)`) with centralized paths in `router-map/routes.tsx`
- **Providers**: Root layout (`app/_layout.tsx`) wraps app in Safe Area, Gesture Handler, Action Sheet, Theme, Query, and Auth providers
- **Component Pattern**: UI components use `class-variance-authority` (CVA) and accept `className` for styling
- **Theming**: `useColorScheme` hook manages light/dark modes; colors defined in `theme/colors.ts`

## Conventions
- **Styling**: Use NativeWind utility classes; avoid hard-coded colors (use `COLORS` or Tailwind tokens)
- **Dark Mode**: Use `dark:` prefix for dark mode specific styles
- **Imports**: Use `@/*` alias for root-relative imports (e.g., `@/components/...`)
- **Naming**: PascalCase for components, camelCase for functions/hooks
- **State**: Use `useStore()` for global state (persisted via MMKV); React Query for async data
- **Navigation**: Use `href` with `RoutePaths` enum for type-safe linking
- **API**: Use `createControllerPaths` helper for endpoint organization

## Development Workflow
- **Start**: `npm start` (runs Expo CLI)
- **Run**: `npm run ios` or `npm run android`
- **Lint/Format**: `npm run format` (ESLint + Prettier)
- **New Screen**: Create in `app/`, add to `RoutePaths`, use `useColorScheme`
- **New Component**: Create in `components/nativewindui/`, implement CVA pattern

## Common Pitfalls
- **Hard-coded Colors**: Fails dark mode; always use theme tokens
- **Direct API Calls**: Bypasses auth injection; always use `api/axios-client.tsx`
- **Sensitive Data**: Do not use `AsyncStorage`; use `MMKV` for secure persistence
- **Layout Bypass**: Ensure new screens are properly wrapped or nested in `_layout.tsx` context

**Example workflow:**
```bash
# ❌ Bad - asking AI to find files
"Find all files that use useRefreshTokens hook"

# ✅ Good - use CLI first, then ask AI about specific files
rg "useRefreshTokens" --type ts --type tsx
# Then: "Explain how useRefreshTokens is used in #hooks/useRefreshTokens.tsx #api/keyclock-integration/useRefreshTokens.tsx"
```

#### Using @terminal for Command Help

**Use `@terminal` for non-premium command-line assistance:**

- Ask `@terminal` how to use CLI tools (grep, find, git, etc.)
- Get help with npm/expo commands
- Learn shell scripting without premium requests

**Example:**
```
✅ "@terminal how to find all TypeScript files containing 'useState'"
✅ "@terminal show me git commands for reviewing recent changes"
❌ "How do I use grep?" (premium request)
```

#### GitHub Copilot CLI for Code Generation

**Use `gh copilot` for simple code generation without premium:**

- Generate boilerplate code using GitHub Copilot CLI
- Create simple functions and components
- Use for repetitive code patterns

**Example:**
```bash
# Generate a React hook boilerplate
gh copilot suggest "Create a React hook for managing network status"

# Generate TypeScript interface
gh copilot suggest "Create TypeScript interface for UserProfile"
```

#### File Operations via CLI

**Use CLI for file operations instead of asking AI:**

- Use `find` to locate files by name or pattern
- Use `grep` to search code content
- Use `git` commands for code review and history
- Use file system commands for organization

**Example:**
```bash
# Find all hook files
find hooks -name "*.tsx" -type f

# Search for error handling patterns
grep "try.*catch" --include=\*.ts --include=\*.tsx

# Review recent changes
git log --oneline --since="1 week ago"
```

#### Code Search Before AI Requests

**Search codebase with CLI tools before asking AI:**

- Identify relevant files using `grep`/`rg`
- Find usage patterns before asking for explanations
- Locate similar implementations before requesting new code

**Example:**
```bash
# ❌ Bad - asking AI to find authentication code
"Where is authentication handled in the codebase?"

# ✅ Good - find files first, then ask AI about specific ones
rg "authentication|auth" --type ts --type tsx | head -20
# Then: "Explain authentication flow in #api/keyclock-integration/ #contexts/auth.tsx"
```

### 5. Optimize Context Size

**Include only necessary context:**

- Reference specific files/symbols instead of entire codebase
- Use file paths when you know exactly what's needed
- Avoid broad `#codebase` searches when specific files are known
- **Use CLI tools to identify relevant files before including in context**

**Example:**

```
✅ "Refactor authentication logic" #api/auth.tsx #store/authStore.tsx
❌ "Refactor this" #codebase
```

### 6. Use Inline Chat for Local Changes

**Prefer Inline Chat for small, focused changes:**

- Use for single-file modifications
- Use for style/formatting changes
- Use for simple refactoring within one component

### 7. Planning Mode for Complex Tasks

**Use Planning Mode before execution:**

- Create a plan first for complex multi-step tasks
- Review and refine the plan before execution
- Reduces iterations and failed attempts

### 8. Reuse Patterns and Solutions

**When providing solutions:**

- Reference existing patterns in the codebase
- Suggest reusable components/utilities
- Point to similar implementations already in the project

## React Native Project Specific Guidelines

### File Structure Awareness

This project uses:

- **Expo Router** for file-based routing (`app/` directory)
- **TypeScript** throughout the codebase
- **Zustand** for state management (`store/` directory)
- **React Query** for server state (`api/` directory)
- **NativeWind** for styling (TailwindCSS utilities)

### Common Patterns

**When working with:**

- **Authentication**: Reference `api/keyclock-integration/` and `store/authStore.tsx`
- **API calls**: Use `api/axios-client.tsx` interceptors pattern
- **State management**: Follow Zustand patterns in `store/` directory
- **Navigation**: Use Expo Router file-based routing in `app/` directory
- **Styling**: Use NativeWind utility classes, reference `constants/DefaultStyles.ts`

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions (camelCase for functions, PascalCase for components)
- Use functional components with hooks
- Prefer async/await over promises
- Use React Query for data fetching
- Use Zustand for global state

## Request Optimization Checklist

Before making a request, ensure:

- [ ] Related questions are grouped together
- [ ] Using `#codebase` instead of multiple file reads
- [ ] Context size is minimized (only necessary files)
- [ ] Using @-mentions for simple VS Code/terminal questions
- [ ] **CLI commands used for file searching before AI requests**
- [ ] **@terminal used for command-line questions (non-premium)**
- [ ] **Context pre-filtered using grep/find commands**
- [ ] **GitHub Copilot CLI considered for simple code generation**
- [ ] Planning mode used for complex multi-step tasks
- [ ] Inline Chat considered for single-file changes
- [ ] All requirements included upfront

## Examples of Optimized Requests

### ✅ Good Examples

```
"Review token refresh implementation in #codebase. Check:
- Error handling for network failures
- Token expiration logic
- Background refresh strategy
- Security best practices
- Suggest improvements"
```

```
"Optimize #useRefreshTokens.tsx for better error recovery and retry logic.
Reference existing error handling patterns in #api/errors.ts"
```

```
"Create a new hook following the pattern in #hooks/useCheckNetworkStatus.tsx
for monitoring app state changes"
```

### ❌ Bad Examples

```
"Explain this file"
"What about errors?"
"How does it work?"
"Can you improve it?"
```

```
"Review all files in the project"
```

```
"Explain file1" [wait] "Explain file2" [wait] "Explain file3"
```

## Monitoring and Feedback

- Track request patterns and optimize based on usage
- Review Chat Debug View to understand context usage
- Adjust instructions based on project needs

---

**Reference Documentation:** `documents/en/copilot-optimization.md` and `documents/ru/copilot-optimization.md`
