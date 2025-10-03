# VIBE Coding - AI Assistant Best Practices

## Overview

This document outlines proven patterns and best practices for maximizing productivity when working with AI coding assistants like Claude Sonnet. It covers prompt engineering, Agent.md usage, context management, and specialized workflows that consistently produce high-quality results.

## Table of Contents

- [Core Principles](#core-principles)
- [Prompt Engineering Best Practices](#prompt-engineering-best-practices)
- [Agent.md Usage Patterns](#agentmd-usage-patterns)
- [Context Management Strategies](#context-management-strategies)
- [Specialized Sub-Agent Workflows](#specialized-sub-agent-workflows)
- [Quality Assurance Patterns](#quality-assurance-patterns)
- [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
- [Advanced Techniques](#advanced-techniques)

## Core Principles

### 1. **V**erbose Context, **I**terative Refinement, **B**roken Down Tasks, **E**xplicit Expectations

**VIBE** represents the fundamental approach to effective AI collaboration:

- **Verbose Context**: Provide comprehensive background information
- **Iterative Refinement**: Work in small, reviewable increments
- **Broken Down Tasks**: Decompose complex requests into manageable pieces
- **Explicit Expectations**: Clearly state desired outcomes and constraints

### 2. Context is King

AI assistants perform best when they have:

- Clear understanding of the project structure
- Knowledge of existing patterns and conventions
- Awareness of constraints and requirements
- Context about what has been tried before

### 3. Incremental Progress

Large changes should be built incrementally:

- Start with foundational components
- Add complexity gradually
- Validate each step before proceeding
- Maintain working state throughout

## Prompt Engineering Best Practices

### 1. Structure Your Requests

#### ✅ Good Pattern:

```
Context: I'm working on a React TypeScript project with MSW for testing.

Task: Create a user authentication service that integrates with our existing MSW setup.

Requirements:
- TypeScript interfaces for User and AuthState
- React context for auth state management
- MSW handlers for login/logout endpoints
- Integration with existing test framework

Constraints:
- Must follow existing MSW patterns in src/shared/mocks/
- Should use our standard error handling approach
- Need to maintain test isolation between test runs

Expected Outcome: Working auth service with tests, following project conventions.
```

#### ❌ Poor Pattern:

```
Make auth for the app
```

### 2. Provide Relevant Context

#### Include:

- **File Structure**: Show relevant parts of the project tree
- **Existing Patterns**: Reference similar implementations in the codebase
- **Configuration**: Include relevant config files or environment setup
- **Dependencies**: Mention key libraries and their versions
- **Constraints**: Technical, business, or architectural limitations

#### Example Context Block:

```
Project Context:
- Frontend: React 18 + TypeScript + Vite
- Testing: Vitest + MSW + Testing Library
- State Management: React Context + useReducer
- Existing Auth: Basic JWT in localStorage (needs improvement)
- MSW Setup: Unified handlers in src/shared/mocks/handlers/

Current Issues:
- No proper auth state management
- Tests don't mock auth properly
- Need better error handling
```

### 3. Be Specific About Code Quality

#### Specify:

- **Code Style**: "Follow existing TypeScript patterns in the codebase"
- **Testing**: "Include comprehensive tests with MSW integration"
- **Error Handling**: "Use the existing error handling patterns from HouseService"
- **Documentation**: "Add JSDoc comments for public APIs"
- **Performance**: "Optimize for fast test execution"

### 4. Use Examples and Anti-Patterns

#### Show What You Want:

```
Follow this pattern from our existing HouseService:
[include code snippet]

Avoid this anti-pattern:
[include what not to do]
```

## Agent.md Usage Patterns

### 1. Project-Level Agent.md

Create a comprehensive project overview that includes:

```markdown
# Project Agent Instructions

## Project Overview

- Purpose: House management system with temperature monitoring
- Architecture: React frontend + .NET backend microservices
- Key Technologies: TypeScript, MSW, Vite, Vitest, Docker

## Code Patterns

- MSW handlers follow unified configuration pattern
- Database helpers use singular naming (clearDatabase, not forceResetDatabase)
- Test environment configured in code, not .env files
- All tests use enableDelay: false for fast execution

## File Structure

[Include key directories and their purposes]

## Quality Standards

- TypeScript strict mode
- Comprehensive test coverage
- MSW for all API mocking
- Zero experimental warnings in tests

## Common Tasks

- When adding new API endpoints: Update MSW handlers in src/shared/mocks/handlers/
- When creating tests: Use DatabaseTestHelpers.clearDatabase() for setup
- When debugging MSW: Check config.ts for enableDelay settings
```

### 2. Feature-Specific Agent Instructions

For complex features, create focused instructions:

```markdown
# Authentication Feature Agent

## Context

Working on user authentication system for house management app.

## Existing Patterns

- MSW handlers in src/shared/mocks/handlers/
- Configuration pattern: createDevelopmentConfig vs createTestConfig
- Database queries follow DatabaseQueries interface pattern
- Tests use clearDatabase() for clean state

## Requirements

- JWT-based authentication
- React Context for state management
- MSW integration for testing
- Proper error handling and loading states

## Files to Consider

- src/shared/mocks/handlers/auth.ts (new)
- src/contexts/AuthContext.tsx (new)
- src/hooks/useAuth.ts (new)
- src/test/utils/auth-helpers.ts (new)
```

### 3. Maintenance-Focused Instructions

For refactoring and cleanup tasks:

```markdown
# Code Quality Agent

## Focus Areas

- Remove duplicate functions (like forceResetDatabase cleanup)
- Simplify configuration (eliminate unnecessary .env files)
- Improve type safety (strict TypeScript)
- Optimize test performance (enableDelay: false patterns)

## Recent Improvements

- Removed .env.test in favor of code-based configuration
- Simplified MSW delay control via config.ts
- Unified database helpers to single clearDatabase function

## Patterns to Follow

- Code-over-configuration approach
- Single source of truth for test setup
- Explicit rather than implicit dependencies
```

## Context Management Strategies

### 1. Managing Context Limits

#### Before Starting Large Tasks:

1. **Context Assessment**: Estimate token usage
2. **Prioritization**: Identify most critical information
3. **Chunking Strategy**: Plan multi-part conversations
4. **Reference Preparation**: Prepare key code snippets

#### During Long Conversations:

1. **Regular Summaries**: Ask for progress summaries
2. **Context Refresh**: Start new conversations with summaries
3. **Focus Shifts**: Change topics to reset context
4. **Key Information**: Repeat critical constraints

### 2. Avoiding Context Degradation

#### Signs of Context Issues:

- Forgetting established patterns
- Reverting to old implementations
- Inconsistent code style
- Missing key requirements

#### Prevention Strategies:

```markdown
Periodic Refreshers:
"Before continuing, please confirm:

- We're using enableDelay: false for tests
- Database cleanup uses clearDatabase() only
- MSW config is in src/shared/mocks/handlers/config.ts
- No .env.test file should be created"
```

### 3. Context Handoff Patterns

When starting new conversations:

```markdown
# Context Handoff Template

## Previous Work Summary

[Brief summary of what was accomplished]

## Current State

[What files were changed, what works, what doesn't]

## Next Steps

[What needs to be done next]

## Key Constraints

[Critical requirements that must not be forgotten]

## Relevant Files

[List of files to examine for context]
```

## Specialized Sub-Agent Workflows

### 1. Architecture Planning Agent

**Purpose**: High-level system design and planning

**Prompt Pattern**:

```
Act as a senior software architect. I need to plan [feature/system].

Current Architecture:
[Provide system overview]

Requirements:
[List functional and non-functional requirements]

Constraints:
[Technical, business, timeline constraints]

Please provide:
1. High-level component design
2. Integration points with existing system
3. Data flow diagrams (in text/ASCII)
4. Implementation phases
5. Risk assessment and mitigation strategies
```

### 2. Code Review Agent

**Purpose**: Quality assurance and code improvement

**Prompt Pattern**:

```
Act as a senior code reviewer. Please review this code for:

Focus Areas:
- Code quality and maintainability
- Performance implications
- Security considerations
- Test coverage gaps
- Consistency with existing patterns

Project Context:
[Include relevant architecture and patterns]

Code to Review:
[Provide code snippets or file references]

Please provide:
1. Specific improvement suggestions
2. Potential issues and risks
3. Consistency check with existing codebase
4. Testing recommendations
```

### 3. Debugging/Troubleshooting Agent

**Purpose**: Systematic problem solving

**Prompt Pattern**:

```
Act as a debugging specialist. I'm experiencing [issue description].

System Context:
[Provide relevant system information]

Error Details:
[Include error messages, stack traces, logs]

What I've Tried:
[List previous debugging attempts]

Current Hypothesis:
[Your current theory about the issue]

Please provide:
1. Systematic debugging approach
2. Additional information to gather
3. Most likely root causes
4. Step-by-step resolution plan
5. Prevention strategies for future
```

### 4. Test Strategy Agent

**Purpose**: Comprehensive testing approach

**Prompt Pattern**:

```
Act as a test automation specialist. I need a testing strategy for [feature/system].

System Under Test:
[Describe the feature/system]

Current Test Setup:
[MSW, Vitest, Testing Library configuration]

Requirements:
- Fast test execution (enableDelay: false)
- Isolated test state (clearDatabase pattern)
- Comprehensive coverage
- Integration with existing MSW setup

Please provide:
1. Test strategy breakdown (unit, integration, e2e)
2. MSW handler requirements
3. Test data management approach
4. Performance optimization strategies
5. CI/CD integration considerations
```

### 5. Documentation Agent

**Purpose**: Creating and maintaining documentation

**Prompt Pattern**:

```
Act as a technical documentation specialist. I need documentation for [system/feature].

Target Audience:
[Developers, users, stakeholders]

System Context:
[Technical details and architecture]

Documentation Requirements:
- Clear examples and code snippets
- Troubleshooting guides
- Best practices
- Integration instructions

Please create:
1. User-friendly overview
2. Technical implementation details
3. Code examples with explanations
4. Common issues and solutions
5. Maintenance and update procedures
```

## Quality Assurance Patterns

### 1. Pre-Implementation Checklist

Before starting any code changes:

```markdown
## Implementation Checklist

Architecture Review:

- [ ] Aligns with existing patterns
- [ ] Follows established conventions
- [ ] Considers performance implications
- [ ] Maintains security standards

Dependencies:

- [ ] Uses existing libraries where possible
- [ ] No unnecessary new dependencies
- [ ] Compatible with current versions
- [ ] Proper import/export patterns

Testing Strategy:

- [ ] Test approach defined
- [ ] MSW integration planned
- [ ] Performance considerations addressed
- [ ] Error scenarios covered

Documentation:

- [ ] Code will be self-documenting
- [ ] Complex logic will have comments
- [ ] Public APIs will have JSDoc
- [ ] README updates identified
```

### 2. Post-Implementation Validation

After completing changes:

```markdown
## Validation Checklist

Functionality:

- [ ] Core requirements met
- [ ] Edge cases handled
- [ ] Error conditions managed
- [ ] Performance acceptable

Code Quality:

- [ ] Follows project conventions
- [ ] TypeScript strict mode compliant
- [ ] No console warnings/errors
- [ ] Proper error handling

Testing:

- [ ] All tests pass
- [ ] New functionality covered
- [ ] No test performance regression
- [ ] MSW handlers working correctly

Integration:

- [ ] Doesn't break existing features
- [ ] Proper component integration
- [ ] Database changes handled correctly
- [ ] Configuration updates applied
```

## Common Pitfalls and Solutions

### 1. Context Forgetting

**Problem**: AI forgets previously established patterns mid-conversation.

**Solution**:

```markdown
Periodic Reinforcement Pattern:
"Before implementing, please confirm our established patterns:

- [Key pattern 1]
- [Key pattern 2]
- [Key constraint]"
```

### 2. Over-Engineering

**Problem**: AI suggests overly complex solutions.

**Solution**:

```markdown
Simplicity Constraint Pattern:
"Please provide the simplest solution that meets requirements.
Follow the existing patterns in [reference file].
Avoid introducing new abstractions unless absolutely necessary."
```

### 3. Inconsistent Code Style

**Problem**: Generated code doesn't match project conventions.

**Solution**:

```markdown
Style Reference Pattern:
"Follow the exact code style from this example:
[Include specific code snippet]

Pay attention to:

- Naming conventions
- File organization
- Import patterns
- Error handling approach"
```

### 4. Test Performance Regression

**Problem**: New tests are slow or don't follow performance patterns.

**Solution**:

```markdown
Performance Constraint Pattern:
"All tests must follow our performance standards:

- Use enableDelay: false in test config
- Use clearDatabase() for setup/teardown
- No artificial delays in test mode
- Target: < 5 seconds for full test suite"
```

### 5. Breaking Changes

**Problem**: Changes break existing functionality unexpectedly.

**Solution**:

```markdown
Safety First Pattern:
"Before making changes:

1. Identify all files that import/use this code
2. Plan backward compatibility strategy
3. List all tests that might be affected
4. Suggest incremental migration approach"
```

## Advanced Techniques

### 1. Multi-Agent Collaboration

For complex features, use specialized agents in sequence:

```
1. Architecture Agent: Plan overall design
2. Implementation Agent: Write core functionality
3. Testing Agent: Create comprehensive tests
4. Review Agent: Quality assurance and optimization
5. Documentation Agent: Create user guides
```

### 2. Context Preservation Techniques

#### Agent Memory Pattern:

```markdown
# Working Memory (Update throughout conversation)

## Current Focus

[What we're working on right now]

## Completed Items

- [x] Item 1 with brief outcome
- [x] Item 2 with brief outcome

## Key Decisions Made

- Decision 1: Rationale
- Decision 2: Rationale

## Active Constraints

- Constraint 1: Still applies
- Constraint 2: Still applies

## Next Steps

1. Step 1
2. Step 2
```

### 3. Error Recovery Patterns

When things go wrong:

```markdown
## Error Recovery Protocol

1. **Stop and Assess**

   - What exactly went wrong?
   - What was the intended outcome?
   - What state are we in now?

2. **Rollback Strategy**

   - Can we revert to last working state?
   - What changes need to be undone?
   - How do we test the rollback?

3. **Root Cause Analysis**

   - Why did this happen?
   - How can we prevent it?
   - What assumptions were wrong?

4. **Forward Fix**
   - What's the minimal fix?
   - How do we test it thoroughly?
   - What additional safeguards are needed?
```

### 4. Performance Optimization Workflows

#### Test Performance Pattern:

```markdown
## Test Performance Optimization

Current State Assessment:

- Measure current test execution time
- Identify slowest test files
- Check for unnecessary delays
- Review database cleanup patterns

Optimization Strategy:

- Ensure enableDelay: false in test config
- Use clearDatabase() consistently
- Minimize MSW handler complexity
- Optimize test data creation

Validation:

- Measure improvement
- Ensure no test flakiness
- Verify all tests still pass
- Document performance standards
```

### 5. Refactoring Workflows

#### Safe Refactoring Pattern:

```markdown
## Safe Refactoring Protocol

1. **Establish Baseline**

   - All tests passing
   - Document current behavior
   - Identify refactoring scope

2. **Plan Changes**

   - Break into small steps
   - Identify risk points
   - Plan rollback strategy

3. **Incremental Changes**

   - One logical change at a time
   - Test after each change
   - Commit working states

4. **Validation**
   - Full test suite passes
   - No performance regression
   - All functionality preserved
```

## Conclusion

Effective AI collaboration is about creating the right conditions for success:

1. **Clear Communication**: Verbose context and explicit expectations
2. **Systematic Approach**: Broken down tasks and iterative refinement
3. **Quality Focus**: Consistent patterns and validation checkpoints
4. **Context Management**: Preventing degradation and managing limits
5. **Specialized Workflows**: Right agent for the right task

The key is to treat AI assistants as highly capable but context-dependent collaborators. Provide them with the information they need, guide them with clear expectations, and validate their work systematically.

Remember: The goal isn't to make AI do everything, but to make AI do the right things efficiently and correctly.

---

_This document should be updated as new patterns emerge and existing patterns are refined through practical experience._
