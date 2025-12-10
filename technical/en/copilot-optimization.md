# Optimizing Copilot Premium Requests

Strategies to reduce the amount of premium requests when using Copilot Chat and Copilot CLI together.

## Strategies for Optimizing Premium Requests

### 1. Efficient Context Management

**Use `#codebase` instead of multiple individual files:**
```bash
# ❌ Bad - multiple separate requests
"Explain file1.tsx"
"Explain file2.tsx"  
"Explain file3.tsx"

# ✅ Good - single request with codebase search
"Explain how authentication works across #codebase"
```

**Group related questions:**
```bash
# ✅ One request instead of three
"How does token refresh work in #codebase? Include error handling and retry logic"
```

### 2. Use Planning and Checkpoints

**Planning Mode** — creates a plan without execution:
- Fewer iterations needed
- One request for planning instead of multiple trial attempts

**Checkpoints** — return to previous state without re-requesting

### 3. Use @-mentions for Simple Tasks

**For simple questions, use specialized assistants:**
```bash
# ✅ Use @vscode for VS Code questions (not premium)
"@vscode how to configure settings"

# ✅ Use @terminal for commands (not premium)
"@terminal find large files"
```

### 4. Optimize Context Size

**Include only necessary files:**
```bash
# ❌ Bad - entire project
"Refactor this" #codebase

# ✅ Good - specific files
"Refactor authentication logic" #auth.tsx #token.ts
```

**Use symbols instead of entire files:**
```bash
# ✅ Mention specific functions/classes
"Explain #refreshToken function"
```

### 5. Use Inline Chat for Local Changes

**Inline Chat** is often more efficient for small changes:
- Less context needed
- More targeted requests
- Fewer premium requests

### 6. Batch Requests in Single Message

```bash
# ✅ One request with multiple tasks
"Review #auth.tsx for:
1. Security vulnerabilities
2. Performance issues  
3. Code style consistency
4. Suggest improvements"
```

### 7. Use Local Models When Possible

**Configure Language Models:**
- Use local models for simple tasks
- Reserve premium for complex tasks

### 8. Reuse Responses

**Save useful responses:**
- Copy solutions to documentation
- Create templates for recurring tasks
- Use Custom Instructions for standard patterns

### 9. Use Agents Efficiently

**Agents can be more efficient:**
- Automatically determine needed context
- Use tools optimally
- Fewer manual iterations

### 10. Avoid Redundant Requests

```bash
# ❌ Bad - multiple clarifications
"Explain this"
"What about error handling?"
"And performance?"
"And security?"

# ✅ Good - single detailed request
"Explain this code including error handling, performance considerations, and security implications"
```

## Practical Examples for React Native Projects

**For React Native project:**

```bash
# ✅ Efficient request
"Review token refresh implementation in #codebase. Check:
- Error handling for network failures
- Token expiration logic  
- Background refresh strategy
- Security best practices"

# ✅ Use specific files
"Optimize #useRefreshTokens.tsx for better error recovery and retry logic"
```

## Monitoring Usage

- Track request count in Copilot settings
- Use Chat Debug View to analyze context
- Optimize based on usage statistics

## Key Takeaways

✅ **Group related questions** into single requests  
✅ **Use `#codebase`** for broad searches instead of multiple file reads  
✅ **Use @-mentions** for simple tasks (non-premium)  
✅ **Optimize context size** - include only necessary files  
✅ **Use Inline Chat** for small, local changes  
✅ **Batch multiple tasks** in one request  
✅ **Reuse responses** and create templates  
✅ **Use Planning mode** to reduce iterations  

---

**Reference:** [VS Code Documentation - Manage context for AI](https://code.visualstudio.com/docs/copilot/chat/copilot-chat-context)

