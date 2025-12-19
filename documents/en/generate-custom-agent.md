# Create Custom Agents for GitHub Copilot

A comprehensive guide to creating specialized AI agents in VS Code that adopt different personas tailored to specific development roles and tasks.

## What Are Custom Agents?

Custom agents enable you to configure GitHub Copilot to adopt different personas with specialized behavior, tools, and instructions. Unlike generic chat, custom agents are pre-configured for specific tasks:

- **Security Reviewer**: Focused on identifying vulnerabilities and security best practices
- **Planner**: Generates detailed implementation plans with read-only tools to prevent changes
- **Solution Architect**: Provides architectural guidance and system design recommendations
- **Code Reviewer**: Focuses on code quality, performance, and maintainability
- **Implementation Agent**: Full editing capabilities with code generation instructions

Each agent maintains its own configuration, making it quick to switch between specialized modes without manually reconfiguring tools and instructions.

## Why Use Custom Agents?

### Task-Specific Capabilities
Different tasks require different tool sets. A planning agent might use only read-only tools (search, fetch, githubRepo) to prevent accidental changes, while an implementation agent needs full editing capabilities.

### Consistent, Specialized Behavior
Custom agents encode specialized instructions that ensure consistent, task-appropriate responses. Once configured, you switch to an agent and immediately get the right mindset and capabilities.

### Multi-Step Workflows with Handoffs
Use handoffs to create guided workflows that transition between agents with pre-filled prompts and context:
- **Planning → Implementation**: Generate a plan, then hand off to implement it
- **Implementation → Review**: Complete code, then transition to code review agent
- **Test-Driven Development**: Create failing tests, then hand off to make them pass

## File Structure & Location

### Creating a Custom Agent

1. **In VS Code**, select **Configure Custom Agents** from the agents dropdown
2. Click **Create new custom agent** (or use Command Palette: `Chat: New Custom Agent`)
3. Choose location:
   - **Workspace**: `.github/agents/` folder (shared with team)
   - **User Profile**: Across all your workspaces (personal)
4. Enter a filename (becomes default agent name)
5. Fill in the `.agent.md` file with YAML frontmatter and instructions

### File Format

Custom agents use `.agent.md` Markdown files with two sections:

```markdown
---
[YAML Frontmatter - Configuration]
---
[Markdown Body - Instructions & Guidelines]
```

## YAML Frontmatter Reference

### Required & Common Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Brief description shown as placeholder in chat input |
| `name` | string | Agent display name (default: filename if omitted) |
| `tools` | array | List of available tools for this agent |
| `argument-hint` | string | Optional hint text in chat input |
| `model` | string | AI model to use (e.g., `Claude Sonnet 4`) |

### Advanced Fields

| Field | Type | Description |
|-------|------|-------------|
| `handoffs` | array | Guided transitions to other agents with suggestions |
| `infer` | boolean | Enable agent as subagent (default: true) |
| `target` | string | Environment: `vscode` or `github-copilot` |
| `mcp-servers` | array | MCP server configs for github-copilot target |

## Tools Configuration

### Available Tool Categories

**Read-Only Tools** (for planning/analysis):
- `search` — Search codebase for patterns
- `fetch` — Retrieve file contents
- `githubRepo` — Access GitHub repo information
- `usages` — Find symbol usages

**Editing Tools** (for implementation):
- All read-only tools, plus:
- `createFile` — Create new files
- `editFiles` — Modify existing files
- `runInTerminal` — Execute commands

**Specialized Tools**:
- `problems` — Linting/compilation errors
- `testFailure` — Test failure details
- `changes` — Git changes

### Specifying Tools

```yaml
---
tools:
  - 'search'
  - 'fetch'
  - 'githubRepo'
---
```

For MCP servers, include all tools:
```yaml
tools:
  - 'mcp-server-name/*'
```

### Tool List Priority

When working in a prompt file + custom agent:
1. Tools specified in the prompt file (highest priority)
2. Tools from the referenced custom agent
3. Default tools for the selected agent (lowest priority)

## Handoffs: Creating Guided Workflows

Handoffs create interactive buttons that guide users to the next step in a workflow with context and pre-filled prompts.

### Defining Handoffs

```yaml
---
description: Generate an implementation plan
tools: ['search', 'fetch']
handoffs:
  - label: Start Implementation
    agent: implementation
    prompt: Now implement the plan outlined above.
    send: false
  - label: Create Tests
    agent: testing
    prompt: Write unit tests for the implementation.
    send: false
---
```

### Handoff Fields

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Button text shown to user |
| `agent` | string | Target agent identifier/filename |
| `prompt` | string | Pre-filled message for next step |
| `send` | boolean | Auto-submit prompt (default: false) |

### Common Workflow Patterns

**Code Quality Pipeline**:
Plan → Implement → Test → Review

**Feature Development**:
Plan → Implement → Write Tests → Code Review

**Security Review**:
Security Audit → Fix Issues → Verify Fixes

## Markdown Body: Instructions & Guidelines

The body is where you define how the agent should behave. Use Markdown formatting with:

### Structure Best Practices

1. **Role Definition**: Clearly state the agent's purpose
2. **Core Instructions**: Top-level guidelines
3. **Categories**: Organize by responsibility (e.g., "## Testing Strategy")
4. **Examples**: Provide code samples showing expected output
5. **Anti-Patterns**: Document what to avoid

### Example Structure

```markdown
---
description: Generate detailed implementation plans
name: Planner
tools: ['search', 'fetch', 'githubRepo']
---
# Planning Agent

You are an expert software architect creating detailed implementation plans.

## Your Role
Generate comprehensive, step-by-step implementation plans without writing code.

## Core Principles
- Analyze the problem space thoroughly
- Break down into manageable tasks
- Identify technical risks
- Suggest testing strategies

## Plan Format
- Overview: High-level summary
- Requirements: What must be done
- Implementation Steps: Detailed, sequential tasks
- Risks & Mitigations: Potential challenges
- Testing: Verification approach
```

### Referencing External Files

Include instructions from separate files using Markdown links:

```markdown
# Extended Instructions

See [API Integration Guidelines](api-integration.instructions.md) for endpoint patterns.
See [Component Patterns](components.instructions.md) for UI conventions.
```

### Referencing Tools in Instructions

Use `#tool:<tool-name>` syntax to highlight available tools:

```markdown
Use #tool:githubRepo to explore existing patterns in the codebase.
Use #tool:search to find similar implementations.
```

## Complete Agent Examples

### Example 1: Planner Agent

```markdown
---
description: Generate an implementation plan
name: Planner
tools: ['search', 'fetch', 'githubRepo', 'usages']
model: Claude Sonnet 4
handoffs:
  - label: Start Implementation
    agent: implementation
    prompt: Now implement the plan outlined above.
    send: false
  - label: Create Tests
    agent: testing
    prompt: Write tests for this implementation.
    send: false
---
# Planning Agent

You are a senior architect tasked with creating detailed implementation plans.

## Your Responsibilities
- Analyze requirements and project context
- Break down features into manageable tasks
- Identify technical decisions and trade-offs
- Suggest testing and deployment strategies
- Document risks and mitigation approaches

## Plan Output Format
Use this structure for every plan:
1. **Overview**: 2-3 sentence summary
2. **Requirements**: Bulleted list of what must be done
3. **Architecture**: Key design decisions
4. **Implementation Steps**: 3-8 numbered, detailed steps
5. **Testing Strategy**: Unit, integration, end-to-end tests needed
6. **Risks & Mitigations**: Potential problems and how to handle them
7. **Dependencies**: External requirements or blockers

## Tools Available
Use #tool:githubRepo to explore the codebase structure.
Use #tool:search to find existing implementations to build upon.
Use #tool:fetch to review relevant documentation.
```

### Example 2: Security Review Agent

```markdown
---
description: Audit code for security vulnerabilities
name: Security Reviewer
tools: ['search', 'fetch', 'problems']
model: Claude Sonnet 4
---
# Security Reviewer Agent

You are a security expert tasked with identifying vulnerabilities and ensuring secure coding practices.

## Focus Areas
1. **Authentication & Authorization**: Session handling, token validation
2. **Data Protection**: Encryption, sensitive data exposure
3. **Injection Attacks**: SQL injection, command injection, XSS
4. **Access Control**: Permission checks, privilege escalation
5. **Cryptography**: Weak algorithms, poor random generation
6. **API Security**: Rate limiting, input validation, output encoding

## Review Process
1. Identify vulnerable patterns
2. Rate severity: CRITICAL, HIGH, MEDIUM, LOW
3. Explain the risk with examples
4. Suggest secure alternatives
5. Recommend testing approaches

## Common Vulnerabilities to Check
- Hardcoded credentials or API keys
- Missing input validation
- Unsafe deserialization
- Weak password hashing
- Missing CSRF tokens
- Insecure direct object references
```

### Example 3: Implementation Agent

```markdown
---
description: Write production-ready code
name: Implementation Agent
tools: ['search', 'fetch', 'createFile', 'editFiles', 'githubRepo']
model: Claude Sonnet 4
handoffs:
  - label: Test Implementation
    agent: testing
    prompt: Write comprehensive tests for this implementation.
    send: false
---
# Implementation Agent

You are a senior software engineer tasked with implementing features and fixes.

## Coding Standards
- Follow project conventions from existing code
- Add comprehensive comments for complex logic
- Handle errors explicitly
- Write defensive code
- Optimize for readability first, performance second

## Implementation Checklist
- [ ] Understand the plan thoroughly
- [ ] Review existing similar implementations
- [ ] Follow project naming conventions
- [ ] Add error handling
- [ ] Include comments for complex sections
- [ ] Consider edge cases
- [ ] Verify against original requirements
```

## Advanced Features

### Subagents (Experimental)

Enable custom agents to run as subagents by setting `infer: true` (default). Subagents can:
- Run in the background on complex tasks
- Inherit the same tools and instructions
- Report results back to the main chat

```yaml
---
name: Implementation Agent
infer: true  # Can be used as subagent
tools: ['createFile', 'editFiles']
---
```

### Model Selection

Specify which AI model to use:

```yaml
---
model: Claude Sonnet 4  # Fast and capable
# or
model: Claude 3.5 Opus  # Most capable, slower
---
```

### MCP Servers (GitHub Copilot)

For cloud agents, configure MCP servers:

```yaml
---
target: github-copilot
mcp-servers:
  - server-name: "my-database"
    config:
      host: "localhost"
      port: 5432
---
```

## Sharing Agents Across Teams

### Workspace Level (Team Sharing)
Create agents in `.github/agents/` folder and commit to version control. All team members get the agents automatically.

### Organization Level (Enterprise)
Create agents at the GitHub organization level. VS Code automatically discovers them when:
- `github.copilot.chat.customAgents.showOrganizationAndEnterpriseAgents` is set to `true`
- You have access to the organization

## Best Practices

### 1. Clear, Focused Purpose
Each agent should have one primary responsibility:
- ✅ "Plan agent for architectural design"
- ❌ "General purpose agent that does everything"

### 2. Minimal Tool Set
Include only tools the agent needs:
- ✅ Planning agent: read-only tools (`search`, `fetch`)
- ❌ Planning agent: editing tools (prevents accidental changes)

### 3. Detailed Instructions
Provide specific, actionable guidance:
- ✅ "Generate a plan with: Overview, Requirements, Steps, Testing, Risks"
- ❌ "Create a plan"

### 4. Examples in Instructions
Show expected output format and tone:
- ✅ Include sample plan structure or code samples
- ❌ Only describe expectations in prose

### 5. Leverage Handoffs
Create natural workflow transitions:
- ✅ Plan → Implement → Test → Review
- ❌ Dump all tasks on one agent

### 6. Test Agents Locally First
Before sharing:
- Create agent in workspace
- Test with real tasks
- Iterate on instructions
- Share when proven effective

### 7. Document Tool Constraints
Explicitly mention what agents can/cannot do:
- "This agent creates files but does not run tests"
- "This agent reviews code but does not make changes"

## Troubleshooting

### Agent Not Appearing in Dropdown
- Ensure file is in `.github/agents/` folder
- Verify `.agent.md` extension (not `.md`)
- Restart VS Code
- Check if agent is hidden via Configure Custom Agents

### Tool Not Working
- Verify tool name is spelled correctly
- Check if tool is available in your VS Code version
- Some tools require extensions to be installed
- If tool not available, it's silently ignored

### Instructions Not Applied
- Instructions are prepended to user's prompt
- Check Agent Debug View to see actual prompt sent
- Verify frontmatter YAML syntax is valid

### Handoffs Not Showing
- Ensure target agent exists
- Check handoff YAML syntax
- User must complete chat response before seeing buttons
- `send: false` shows button, `send: true` auto-submits

## Migration from Chat Modes

If you have legacy `.chatmode.md` files in `.github/chatmodes/`:
- VS Code still recognizes them as custom agents
- Use Quick Fix to migrate to new `.agent.md` format in `.github/agents/`
- Functionality remains the same, only naming convention changes

## Related Resources

- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) — Universal guidelines for all chat
- [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files) — Reusable prompts for specific tasks
- [Tools in Chat](https://code.visualstudio.com/docs/copilot/chat/chat-tools) — Full reference of available tools
- [Awesome Copilot](https://github.com/github/awesome-copilot) — Community-contributed agents and examples
- [VS Code Copilot Documentation](https://code.visualstudio.com/docs/copilot) — Official reference

## Quick Checklist for Creating an Agent

- [ ] Create `.agent.md` file in `.github/agents/` folder
- [ ] Add `description` and `name` in YAML frontmatter
- [ ] Select appropriate `tools` for the agent's purpose
- [ ] Write clear instructions in Markdown body
- [ ] Include examples or expected output format
- [ ] Add `handoffs` for multi-step workflows if applicable
- [ ] Test agent with realistic scenarios
- [ ] Share with team by committing to `.github/agents/`
- [ ] Document the agent's purpose and use cases
