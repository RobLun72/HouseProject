# HouseProject Agent System

_Master orchestration and context management for AI-assisted development_

## Project Overview

**HouseProject** - A microservices-based IoT temperature monitoring system with React frontend and .NET Core backend services.

### Architecture Components

- **Frontend**: React + TypeScript + Tailwind CSS + ShadCN UI
- **Backend**: ASP.NET Core Web APIs (HouseService, TemperatureService)
- **Database**: PostgreSQL with Entity Framework Core
- **Infrastructure**: Docker, Docker Compose
- **Testing**: xUnit for backend, potentially Jest/RTL for frontend

## Agent Delegation Framework

### 🎯 When to Use Which Agent

| Task Type                        | Delegate To               | Rationale                                         |
| -------------------------------- | ------------------------- | ------------------------------------------------- |
| **Large/Complex Tasks (#large)** | `LargeTask-Agent.md`      | **Multi-phase planning and structured breakdown** |
| React Components/UI              | `Frontend-Agent.md`       | Specialized in React patterns, state management   |
| API Controllers/Services         | `Backend-Agent.md`        | Expert in .NET Core, EF Core, REST APIs           |
| Database schemas/migrations      | `Database-Agent.md`       | Focused on PostgreSQL, EF migrations              |
| Docker/Infrastructure            | `Infrastructure-Agent.md` | Container orchestration, deployment               |
| Testing (any layer)              | `Testing-Agent.md`        | Unit tests, integration tests, TDD                |
| Architecture decisions           | Stay with Master Agent    | Cross-cutting concerns need full context          |

### 🔄 LargeTask-Agent Integration

The **LargeTask-Agent** serves as a meta-planning layer for complex work:

- **Activation**: Use `#large` keyword in any request (works with specialized agents too)
- **Process**: Creates comprehensive planning documents with structured todos
- **Delegation**: Can delegate implementation phases to specialized agents
- **File Output**: Stores plans as `#file [name].md` or defaults to `large_task.md`

**Workflow Examples**:

```
User Request → Agent.md → LargeTask-Agent.md → [Planning Document] → Continue Question → Specialized Agents
User Request → Frontend-Agent.md → LargeTask-Agent.md (#large) → [Planning] → Continue Question → Frontend-Agent.md
```

### 🔄 Delegation Protocol

```markdown
1. **Context Handoff**: Always provide current file paths, recent changes
2. **Scope Definition**: Clearly define what the sub-agent should accomplish
3. **Constraints**: Specify existing patterns, naming conventions, dependencies
4. **Return Protocol**: Sub-agent provides code + explanation + integration notes
```

### 🏗️ Large Task Planning Protocol

When `#large` keyword is detected:

```markdown
1. **Immediate Planning**: LargeTask-Agent creates comprehensive planning document
2. **Structured Breakdown**: Multi-phase approach with dependencies and risk assessment
3. **Continue Question**: User reviews and confirms plan before implementation begins
4. **Context Handoff**: Planning document becomes primary context for specialized agents
5. **Progress Tracking**: Specialized agents cross off todos and update planning document
6. **Documentation**: All planning and progress stored in markdown files for future reference
```

**Integration Points**:

- **From Master Agent**: Full project context and architectural decisions
- **To Specialized Agents**: Phase-specific implementation with clear scope
- **Planning Documents**: Persistent documentation of approach and decisions
- **Quality Gates**: Built-in review checkpoints and validation criteria

## Current Project State

### Recent Refactoring Context

- ✅ Consolidated React state management (11 useState → single pageState object)
- ✅ Streamlined API controllers (removed unnecessary endpoints)
- ✅ Extracted RoomTemperatureDialog to separate component
- 🔧 Current naming convention: `parentComponent` + descriptive suffix

### Active Patterns & Conventions

- **State Management**: Single state objects with atomic updates
- **API Calls**: Custom hooks for env variables, consistent error handling
- **File Naming**: Descriptive, hierarchical naming (e.g., `houseTemperaturesRoomTemperature.tsx`)
- **Component Structure**: Extract dialogs/modals to separate files
- **TypeScript**: Explicit interfaces, proper error handling

### Key Integration Points

- API Base URLs via `useTemperatureApiEnvVariables()`
- Consistent error handling patterns
- ShadCN UI component library
- PostgreSQL via Entity Framework Core

## 📋 Session Management

### Conversation Continuity

```markdown
Each sub-agent should receive:

1. Project context (this file)
2. Relevant file paths and current state
3. Specific task requirements
4. Integration requirements (how it fits with existing code)
```

### Quality Gates

- Code must compile without errors
- Follow established patterns and conventions
- Include proper TypeScript typing
- Maintain consistent error handling
- Consider performance implications

## 🎛️ Master Agent Responsibilities

- Architectural decisions spanning multiple services
- Cross-cutting concerns (authentication, logging, error handling)
- Project structure and organization
- Integration between frontend and backend
- Performance optimization strategies
- Security considerations
- **Large task coordination**: Orchestrating multi-phase implementations via LargeTask-Agent
- **Planning document review**: Validating comprehensive plans before implementation begins

---

_Last Updated: September 29, 2025_
_Current Branch: fix-better-calls-for-front-end_
