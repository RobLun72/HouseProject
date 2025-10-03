# VIBE Collaboration Diagram - Agent System Architecture

## Overview

This document provides visual diagrams showing how the master Agent.md coordinates with specialized agents in the `.agents` folder to handle different types of development tasks through the VIBE methodology.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VIBE Agent Ecosystem                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │    Agent.md     │ ◄─── User Request                                      │
│  │  (Master Agent) │                                                        │
│  │                 │                                                        │
│  │ • Orchestration │                                                        │
│  │ • Delegation    │                                                        │
│  │ • Architecture  │                                                        │
│  │ • Integration   │                                                        │
│  └─────────┬───────┘                                                        │
│            │                                                                │
│            ▼                                                                │
│  ┌───────────────────────────────────────────────────────┐                  │
│  │   .agents/                                            │                  │
│  │                                                       │                  │
│  │ ┌─────────────┐    ┌─────────────┐   ┌─────────────┐  │                  │
│  │ │Frontend-    │    │Backend-     │   │Database-    │  │                  │
│  │ │Agent.md     │    │Agent.md     │   │Agent.md     │  │                  │
│  │ └─────────────┘    └─────────────┘   └─────────────┘  │                  │
│  │                                                       │                  │
│  │ ┌─────────────┐    ┌──────────────┐   ┌─────────────┐ │                  │
│  │ │Testing-     │    │Infrastructure│   │LargeTask-   │ │                  │
│  │ │Agent.md     │    │Agent.md      │   │Agent.md     │ │                  │
│  │ └─────────────┘    └──────────────┘   └─────────────┘ │                  │
│  └───────────────────────────────────────────────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Delegation Decision Flow

```
User Request → Agent.md
       │
       ▼
┌─────────────────┐
│ Request Analysis│
│                 │
│ What type of    │
│ work is this?   │
└─────────┬───────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Decision Matrix                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Contains #large? ──────────Yes────────► LargeTask-Agent.md              │
│        │                                       │                        │
│        No                                      ▼                        │
│        │                             Create Planning Document           │
│        ▼                                       │                        │
│                                                ▼                        │
│ React/UI/Components? ────Yes────► Frontend-Agent.md                     │
│        │                                       │                        │
│        No                                      ▼                        │
│        │                              Hand off to specialized           │
│        ▼                                  agent with plan               │
│                                                                         │
│ API/Controllers/Services? ──Yes──► Backend-Agent.md                     │
│        │                                                                │
│        No                                                               │
│        │                                                                │
│        ▼                                                                │
│                                                                         │
│ Database/Migrations? ────Yes────► Database-Agent.md                     │
│        │                                                                │
│        No                                                               │
│        │                                                                │
│        ▼                                                                │
│                                                                         │
│ Docker/Deployment? ──────Yes────► Infrastructure-Agent.md               │
│        │                                                                │
│        No                                                               │
│        │                                                                │
│        ▼                                                                │
│                                                                         │
│ Testing/QA? ─────────────Yes────► Testing-Agent.md                      │
│        │                                                                │
│        No                                                               │
│        │                                                                │
│        ▼                                                                │
│                                                                         │
│ Cross-cutting concerns? ──Yes────► Stay with Master Agent               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Standard Workflow Pattern

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Standard Task Flow                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Request                                                             │
│     │                                                                        │
│     ▼                                                                        │
│  ┌─────────────────┐                                                         │
│  │   Agent.md      │  2. Analyze request type and complexity                 │
│  │ (Master Agent)  │                                                         │
│  └─────────┬───────┘                                                         │
│            │                                                                 │
│            ▼                                                                 │
│  3. Context Handoff                                                          │
│     ┌─────────────────────────────────────────────┐                          │
│     │ • Project overview and current state        │                          │
│     │ • Relevant file paths and recent changes    │                          │
│     │ • Specific task requirements                │                          │
│     │ • Integration requirements                  │                          │
│     │ • Quality standards and constraints         │                          │
│     └─────────────────┬───────────────────────────┘                          │
│                       │                                                      │
│                       ▼                                                      │
│  ┌─────────────────────────────────────┐                                     │
│  │       Specialized Agent             │  4. Execute with full context       │
│  │    (Frontend/Backend/Database/      │                                     │
│  │     Testing/Infrastructure)         │                                     │
│  └─────────────────┬───────────────────┘                                     │
│                    │                                                         │
│                    ▼                                                         │
│  5. Return Results                                                           │
│     ┌─────────────────────────────────────────────┐                          │
│     │ • Code changes and explanations             │                          │
│     │ • Integration notes for other components    │                          │
│     │ • Testing considerations                    │                          │
│     │ • Breaking changes (if any)                 │                          │
│     └─────────────────────────────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Large Task Workflow (#large keyword)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Large Task Flow                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Request + #large                                                       │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────┐                                                         │
│  │   Agent.md      │  Recognizes #large keyword                              │
│  │ (Master Agent)  │  │                                                      │
│  └─────────┬───────┘  │                                                      │
│            │          │                                                      │
│            ▼          ▼                                                      │
│  ┌─────────────────────────────────────┐                                     │
│  │      LargeTask-Agent.md             │  1. Create comprehensive plan       │
│  │                                     │                                     │
│  │ • Task analysis and decomposition   │                                     │
│  │ • Risk assessment                   │                                     │
│  │ • Multi-phase breakdown             │                                     │
│  │ • Quality gates                     │                                     │
│  │ • Timeline estimation               │                                     │
│  └─────────────────┬───────────────────┘                                     │
│                    │                                                         │
│                    ▼                                                         │
│  2. Create Large_Task.md                                                     │
│     ┌─────────────────────────────────────────────┐                          │
│     │ Comprehensive planning document with:       │                          │
│     │ • Structured todo lists                     │                          │
│     │ • Phase organization                        │                          │
│     │ • Dependencies and constraints              │                          │
│     │ • Quality gates and validation points       │                          │
│     │ • Risk mitigation strategies                │                          │
│     └─────────────────┬───────────────────────────┘                          │
│                       │                                                      │
│                       ▼                                                      │
│  3. Continue Question                                                        │
│     ┌─────────────────────────────────────────────┐                          │
│     │ "Planning Complete: Review and confirm?"    │                          │
│     │                                             │                          │
│     │ • Plan summary and overview                 │                          │
│     │ • Timeline and phase breakdown              │                          │
│     │ • Quality gates overview                    │                          │
│     │ • Next steps explanation                    │                          │
│     └─────────────────┬───────────────────────────┘                          │
│                       │                                                      │
│           ┌───────────┴───────────┐                                          │
│           │                       │                                          │
│           ▼                       ▼                                          │
│    User Confirms            User Requests Changes                            │
│           │                       │                                          │
│           │                       ▼                                          │
│           │              Modify planning document                            │
│           │                       │                                          │
│           │                       ▼                                          │
│           │              Return to Continue Question                         │
│           │                                                                  │
│           ▼                                                                  │
│  4. Context Handoff to Specialized Agent                                     │
│     ┌─────────────────────────────────────────────┐                          │
│     │ Specialized Agent receives:                 │                          │
│     │ • Large_Task.md as primary context          │                          │
│     │ • Current phase and specific tasks          │                          │
│     │ • Quality gates and constraints             │                          │
│     │ • Progress tracking responsibilities        │                          │
│     └─────────────────┬───────────────────────────┘                          │
│                       │                                                      │
│                       ▼                                                      │
│  5. Implementation with Progress Tracking                                    │
│     ┌─────────────────────────────────────────────┐                          │
│     │ Specialized Agent:                          │                          │
│     │ • Checks Large_Task.md for context          │                          │
│     │ • Executes current phase tasks              │                          │
│     │ • Crosses off completed todos (- [x])       │                          │
│     │ • Updates with implementation notes         │                          │
│     │ • Documents issues and decisions            │                          │
│     └─────────────────────────────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Specialized Agent Interaction Patterns

### Frontend-Agent.md Collaboration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Frontend-Agent Specialization                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input from Agent.md:                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • React component requests                                      │    │
│  │ • UI/UX implementation tasks                                    │    │
│  │ • State management challenges                                   │    │
│  │ • TypeScript interface needs                                    │    │
│  │ • Testing setup for components                                  │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
│                    │                                                    │
│                    ▼                                                    │
│  Frontend-Agent Processing:                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Applies React/TypeScript patterns                             │    │
│  │ • Follows ShadCN UI conventions                                 │    │
│  │ • Implements MSW testing integration                            │    │
│  │ • Uses established state management patterns                    │    │
│  │ • Maintains component hierarchy standards                       │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
│                    │                                                    │
│                    ▼                                                    │
│  Output back to Master:                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • React components with proper TypeScript                       │    │
│  │ • Integration notes for parent components                       │    │
│  │ • MSW handler updates needed                                    │    │
│  │ • State management patterns applied                             │    │
│  │ • Testing considerations documented                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backend-Agent.md Collaboration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend-Agent Specialization                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Input from Agent.md:                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • API controller development                                    │    │
│  │ • Service layer implementation                                  │    │
│  │ • Database integration needs                                    │    │
│  │ • Entity Framework operations                                   │    │
│  │ • Authentication/authorization logic                            │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
│                    │                                                    │
│                    ▼                                                    │
│  Backend-Agent Processing:                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Applies ASP.NET Core patterns                                 │    │
│  │ • Implements proper dependency injection                        │    │
│  │ • Uses Entity Framework best practices                          │    │
│  │ • Maintains RESTful API conventions                             │    │
│  │ • Applies consistent error handling                             │    │
│  └─────────────────┬───────────────────────────────────────────────┘    │
│                    │                                                    │
│                    ▼                                                    │
│  Output back to Master:                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • API controllers with proper structure                         │    │
│  │ • Service implementations with DI                               │    │
│  │ • Database migration requirements                               │    │
│  │ • Integration points with other services                        │    │
│  │ • Testing patterns and considerations                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cross-Agent Communication Patterns

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Multi-Agent Collaboration Example                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Scenario: "Add user authentication with React frontend and .NET backend"    │
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │   Agent.md      │  1. Recognizes cross-cutting concern                    │
│  │ (Master Agent)  │     • Frontend + Backend + Database                     │
│  └─────────┬───────┘     • Requires coordination                             │
│            │                                                                 │
│            ▼                                                                 │
│  2. Orchestration Plan:                                                      │
│     ┌─────────────────────────────────────────────┐                          │
│     │ Phase 1: Backend-Agent → API structure      │                          │
│     │ Phase 2: Database-Agent → User schema       │                          │
│     │ Phase 3: Backend-Agent → Auth controllers   │                          │
│     │ Phase 4: Frontend-Agent → Auth components   │                          │
│     │ Phase 5: Testing-Agent → Integration tests  │                          │
│     └─────────────────┬───────────────────────────┘                          │
│                       │                                                      │
│                       ▼                                                      │
│  3. Sequential Delegation with Context Handoff:                              │
│                                                                              │
│     Backend-Agent.md ────► Creates Auth Controllers                          │
│            │                        │                                        │
│            ▼                        ▼                                        │
│     Database-Agent.md ────► User Schema & Migration                          │
│            │                        │                                        │
│            ▼                        ▼                                        │
│     Frontend-Agent.md ────► Auth Components & State                          │
│            │                        │                                        │
│            ▼                        ▼                                        │
│     Testing-Agent.md ────► End-to-End Auth Tests                             │
│                                                                              │
│  4. Integration Validation:                                                  │
│     ┌─────────────────────────────────────────────┐                          │
│     │ Master Agent validates:                     │                          │
│     │ • All components work together              │                          │
│     │ • Consistent patterns across layers         │                          │
│     │ • No breaking changes to existing code      │                          │
│     │ • Documentation is updated                  │                          │
│     └─────────────────────────────────────────────┘                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Context Management Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Context Management Pipeline                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │   User Request  │                                                         │
│  └─────────┬───────┘                                                         │
│            │                                                                 │
│            ▼                                                                 │
│  ┌─────────────────────────────────────────────┐                             │
│  │            Agent.md Context Assembly        │                             │
│  │                                             │                             │
│  │ Gathers:                                    │                             │
│  │ • Project structure and current state       │                             │
│  │ • Established patterns and conventions      │                             │
│  │ • Recent changes and decisions              │                             │
│  │ • Quality standards and constraints         │                             │
│  │ • Integration requirements                  │                             │
│  └─────────────────┬───────────────────────────┘                             │
│                    │                                                         │
│                    ▼                                                         │
│  ┌─────────────────────────────────────────────┐                             │
│  │         Context Handoff Package             │                             │
│  │                                             │                             │
│  │ ┌─────────────────────────────────────────┐ │                             │
│  │ │ Project Context                         │ │                             │
│  │ │ • Architecture overview                 │ │                             │
│  │ │ • Technology stack                      │ │                             │
│  │ │ • Current patterns                      │ │                             │
│  │ └─────────────────────────────────────────┘ │                             │
│  │                                             │                             │
│  │ ┌─────────────────────────────────────────┐ │                             │
│  │ │ Task Context                            │ │                             │
│  │ │ • Specific requirements                 │ │                             │
│  │ │ • Files to be modified                  │ │                             │
│  │ │ • Expected outcomes                     │ │                             │
│  │ └─────────────────────────────────────────┘ │                             │
│  │                                             │                             │
│  │ ┌─────────────────────────────────────────┐ │                             │
│  │ │ Quality Context                         │ │                             │
│  │ │ • Code standards                        │ │                             │
│  │ │ • Testing requirements                  │ │                             │
│  │ │ • Performance constraints               │ │                             │
│  │ └─────────────────────────────────────────┘ │                             │
│  │                                             │                             │
│  │ ┌─────────────────────────────────────────┐ │                             │
│  │ │ Integration Context                     │ │                             │
│  │ │ • Dependencies on other components      │ │                             │
│  │ │ • Breaking change considerations        │ │                             │
│  │ │ • Coordination requirements             │ │                             │
│  │ └─────────────────────────────────────────┘ │                             │
│  └─────────────────┬───────────────────────────┘                             │
│                    │                                                         │
│                    ▼                                                         │
│  ┌─────────────────────────────────────────────┐                             │
│  │        Specialized Agent Processing         │                             │
│  │                                             │                             │
│  │ • Receives complete context package         │                             │
│  │ • Applies domain-specific expertise         │                             │
│  │ • Maintains consistency with patterns       │                             │
│  │ • Produces high-quality, integrated output  │                             │
│  └─────────────────┬───────────────────────────┘                             │
│                    │                                                         │
│                    ▼                                                         │
│  ┌─────────────────────────────────────────────┐                             │
│  │           Result Integration                │                             │
│  │                                             │                             │
│  │ • Code changes with explanations            │                             │
│  │ • Integration notes for other agents        │                             │
│  │ • Testing and validation requirements       │                             │
│  │ • Documentation updates needed              │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Quality Assurance Integration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Quality Gates Throughout Workflow                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pre-Delegation Quality Check:                                               │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Agent.md verifies:                          │                             │
│  │ - Clear requirements definition             │                             │
│  │ - Appropriate agent selection               │                             │
│  │ - Complete context handoff                  │                             │
│  │ - Quality standards communicated            │                             │
│  └─────────────────┬───────────────────────────┘                             │
│                    │                                                         │
│                    ▼                                                         │
│  During Specialized Processing:                                              │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Specialized Agent ensures:                  │                             │
│  │ - Domain-specific best practices applied    │                             │
│  │ - Existing patterns followed                │                             │
│  │ - Code quality standards maintained         │                             │
│  │ - Integration points considered             │                             │
│  └─────────────────┬───────────────────────────┘                             │
│                    │                                                         │
│                    ▼                                                         │
│  Post-Implementation Validation:                                             │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Master Agent validates:                     │                             │
│  │ - Requirements fully met                    │                             │
│  │ - No breaking changes introduced            │                             │
│  │ - Consistent with project architecture      │                             │
│  │ - Proper documentation provided             │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Error Recovery and Escalation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      Error Handling and Recovery                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Error Detection Points:                                                     │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │ Requirements    │    │ Implementation  │    │ Integration     │           │
│  │ Ambiguity       │    │ Inconsistency   │    │ Conflicts       │           │
│  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘           │
│            │                      │                      │                   │
│            ▼                      ▼                      ▼                   │
│                                                                              │
│  Recovery Actions:                                                           │
│                                                                              │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Agent.md Escalation Protocol:               │                             │
│  │                                             │                             │
│  │ 1. Stop current processing                  │                             │
│  │ 2. Identify the specific issue              │                             │
│  │ 3. Determine if specialized knowledge needed│                             │
│  │ 4. Either:                                  │                             │
│  │    • Clarify requirements with user         │                             │
│  │    • Delegate to different specialized agent│                             │
│  │    • Coordinate between multiple agents     │                             │
│  │ 5. Resume with corrected approach           │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
│  Example Error Scenarios:                                                    │
│                                                                              │
│  Scenario 1: Frontend-Agent suggests backend changes                         │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Detection: Agent.md notices scope creep     │                             │
│  │ Action: Clarify requirements, possibly      │                             │
│  │         delegate backend portion to         │                             │
│  │         Backend-Agent.md                    │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
│  Scenario 2: Conflicting patterns suggested                                  │
│  ┌─────────────────────────────────────────────┐                             │
│  │ Detection: Inconsistent with established    │                             │
│  │           project patterns                  │                             │
│  │ Action: Reinforce correct patterns,         │                             │
│  │         re-delegate with clearer context    │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## VIBE Principles Integration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    VIBE Principles in Agent Collaboration                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  V - Verbose Context                                                         │
│  ┌─────────────────────────────────────────────┐                             │
│  │ • Agent.md provides comprehensive context   │                             │
│  │ • Project state, patterns, constraints      │                             │
│  │ • File locations and recent changes         │                             │
│  │ • Integration requirements                  │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
│  I - Iterative Refinement                                                    │
│  ┌─────────────────────────────────────────────┐                             │
│  │ • Multi-phase task breakdown                │                             │
│  │ • Validation checkpoints between phases     │                             │
│  │ • Feedback loops for course correction      │                             │
│  │ • Progressive complexity building           │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
│  B - Broken Down Tasks                                                       │
│  ┌─────────────────────────────────────────────┐                             │
│  │ • Clear delegation to specialized agents    │                             │
│  │ • Single responsibility per agent           │                             │
│  │ • Manageable scope for each task            │                             │
│  │ • Proper dependency ordering                │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
│  E - Explicit Expectations                                                   │
│  ┌─────────────────────────────────────────────┐                             │
│  │ • Clear deliverable definitions             │                             │
│  │ • Quality standards communicated            │                             │
│  │ • Success criteria established              │                             │
│  │ • Integration requirements specified        │                             │
│  └─────────────────────────────────────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Summary

The VIBE agent collaboration system provides:

1. **Clear Delegation** - Master Agent.md intelligently routes work to specialized agents
2. **Context Preservation** - Complete project context travels with each delegation
3. **Quality Assurance** - Built-in quality gates and validation checkpoints
4. **Error Recovery** - Systematic error detection and recovery protocols
5. **Scalable Architecture** - Easy to add new specialized agents as needed

This system ensures consistent, high-quality results while maintaining efficiency and proper separation of concerns across different development domains.

---

_This diagram should be updated as new agents are added or collaboration patterns evolve._
