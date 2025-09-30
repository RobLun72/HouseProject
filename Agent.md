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

| Task Type                   | Delegate To               | Rationale                                       |
| --------------------------- | ------------------------- | ----------------------------------------------- |
| React Components/UI         | `Frontend-Agent.md`       | Specialized in React patterns, state management |
| API Controllers/Services    | `Backend-Agent.md`        | Expert in .NET Core, EF Core, REST APIs         |
| Database schemas/migrations | `Database-Agent.md`       | Focused on PostgreSQL, EF migrations            |
| Docker/Infrastructure       | `Infrastructure-Agent.md` | Container orchestration, deployment             |
| Testing (any layer)         | `Testing-Agent.md`        | Unit tests, integration tests, TDD              |
| Architecture decisions      | Stay with Master Agent    | Cross-cutting concerns need full context        |

### 🔄 Delegation Protocol

```markdown
1. **Context Handoff**: Always provide current file paths, recent changes
2. **Scope Definition**: Clearly define what the sub-agent should accomplish
3. **Constraints**: Specify existing patterns, naming conventions, dependencies
4. **Return Protocol**: Sub-agent provides code + explanation + integration notes
```

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

---

_Last Updated: September 29, 2025_
_Current Branch: fix-better-calls-for-front-end_
