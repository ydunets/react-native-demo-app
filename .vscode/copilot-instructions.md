# Copilot Instructions: Request Optimization

## Overview

These instructions help optimize premium request usage when working with Copilot Chat and Copilot CLI. Follow these guidelines to reduce costs while maintaining productivity.

## Core Optimization Principles

### 1. Context Management

**ALWAYS prefer `#codebase` search over multiple individual file reads:**

- Use `#codebase` for broad searches across the codebase
- Only include specific files when absolutely necessary
- Use symbol references (`#functionName`) instead of entire files when possible

**Example:**

```
✅ "Explain authentication flow in #codebase"
❌ "Explain file1.tsx" then "Explain file2.tsx" then "Explain file3.tsx"
```

### 2. Batch Related Questions

**Group related questions into single requests:**

- Combine multiple related tasks in one prompt
- Include all requirements upfront (error handling, performance, security)
- Avoid follow-up clarification requests when possible

**Example:**

```
✅ "Review #auth.tsx for security vulnerabilities, performance issues, and code style consistency"
❌ "Review #auth.tsx" → "What about security?" → "And performance?" → "Code style?"
```

### 3. Use Non-Premium Resources

**Prefer @-mentions for simple tasks:**

- Use `@vscode` for VS Code configuration questions
- Use `@terminal` for command-line operations
- Use `@workspace` for workspace-specific questions

### 4. CLI Tools for Request Reduction

**Use command-line tools to handle tasks that don't require AI assistance:**

CLI tools can significantly reduce premium requests by handling file operations, code searching, and simple code generation without AI.

#### Pre-filtering Context with CLI

**Use CLI commands to narrow down files before including in context:**

- Use `grep` or `ripgrep` (`rg`) to find code patterns before asking AI
- Use `find` to locate files matching patterns before context inclusion
- Use `git grep` to search within version-controlled files
- Filter results to specific file types or directories

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
- Use `grep`/`rg` to search code content
- Use `git` commands for code review and history
- Use file system commands for organization

**Example:**
```bash
# Find all hook files
find hooks -name "*.tsx" -type f

# Search for error handling patterns
rg "try.*catch" --type ts --type tsx

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

**Reference Documentation:** `technical/en/copilot-optimization.md` and `technical/ru/copilot-optimization.md`
