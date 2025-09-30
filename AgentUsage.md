# Agent Usage Guide

_Comprehensive guide for using the HouseProject Agent system effectively_

## 🎯 Overview

The HouseProject Agent system is designed to provide specialized expertise and maintain consistency across different aspects of development. This guide shows you how to leverage the system for maximum efficiency.

## 📋 Quick Reference

### When to Use Which Agent

| **Scenario**                           | **Agent**                | **Keywords**                                       |
| -------------------------------------- | ------------------------ | -------------------------------------------------- |
| Cross-cutting architectural decisions  | **Master Agent**         | "architecture", "integration", "multiple services" |
| React components, state management, UI | **Frontend-Agent**       | "component", "React", "TypeScript", "state"        |
| API endpoints, controllers, services   | **Backend-Agent**        | "API", "controller", "service", ".NET Core"        |
| Database schema, migrations, queries   | **Database-Agent**       | "database", "migration", "schema", "PostgreSQL"    |
| Unit tests, integration tests          | **Testing-Agent**        | "test", "testing", "mock", "coverage"              |
| Docker, deployment, configuration      | **Infrastructure-Agent** | "Docker", "deploy", "container", "environment"     |

## 🎭 Agent Request Patterns

### 1. **Master Agent (Orchestration) Requests**

Use when you need **architectural guidance**, **cross-service coordination**, or **project-wide decisions**.

#### ✅ Good Master Agent Requests

```markdown
"I need to implement user authentication across both the HouseService and TemperatureService.
Please provide an architectural approach that integrates with our current microservices setup."

"We're getting performance issues when displaying house temperatures.
Can you analyze the full stack and suggest optimizations across frontend, backend, and database?"

"I want to add real-time notifications when temperature thresholds are exceeded.
Please design an architecture that fits with our current Docker setup."
```

#### ❌ Avoid These for Master Agent

```markdown
"Fix this React component bug" ➜ Use Frontend-Agent
"Add a database column" ➜ Use Database-Agent  
"Create a unit test" ➜ Use Testing-Agent
```

### 2. **Specialized Agent Requests**

Use when you have **domain-specific tasks** that align with an agent's expertise.

---

## 🎨 Frontend-Agent Examples

### Basic Component Creation

```markdown
"Please refer to Frontend-Agent.md and create a new component for editing house information.
The component should:

- Follow our current state management patterns (single state object)
- Use ShadCN UI components for the form
- Include proper TypeScript interfaces
- Handle API calls with our standard error handling

Current context: This will be used in the house list page to allow inline editing."
```

### State Management Refactoring

```markdown
"Using Frontend-Agent.md as guidance, refactor the temperature reporting page to use
our consolidated state pattern. Currently it has multiple useState calls that are
causing race conditions.

Files involved:

- src/pages/Temperature/reportTemperature.tsx
- Current issue: Multiple state updates causing UI flickering"
```

### Component Extraction

```markdown
"Following Frontend-Agent.md patterns, extract the temperature chart from the main
dashboard into a separate reusable component.

Requirements:

- Should accept temperature data as props
- Include loading and error states
- Follow our naming convention (dashboardTemperatureChart.tsx)
- Maintain responsive design with Tailwind"
```

---

## 🔧 Backend-Agent Examples

### API Endpoint Creation

```markdown
"Please refer to Backend-Agent.md and create a new API endpoint for retrieving
temperature statistics by date range.

Requirements:

- GET /api/Temperature/statistics?startDate=X&endDate=Y
- Return min/max/average temperatures per room
- Follow our current controller patterns
- Include proper error handling and logging
- Add appropriate validation for date parameters"
```

### Service Layer Enhancement

```markdown
"Using Backend-Agent.md as context, enhance the TemperatureService to support
bulk temperature inserts for IoT device data.

Current context:

- Need to handle 100+ temperature readings per request
- Maintain data integrity and validation
- Performance is critical (should process within 2 seconds)
- Follow our existing service patterns"
```

### API Cleanup & Optimization

```markdown
"Referring to Backend-Agent.md, review and optimize the HouseController.
Remove any unused endpoints and consolidate similar operations.

Current issue: Too many similar endpoints causing confusion
Goal: Clean, minimal API surface following REST principles"
```

---

## 🗄️ Database-Agent Examples

### Schema Design

```markdown
"Please refer to Database-Agent.md and design a new table structure for storing
temperature alerts and thresholds.

Requirements:

- Rooms can have min/max temperature thresholds
- Track when alerts are triggered
- Support different alert types (warning, critical)
- Follow our UTC date handling patterns
- Include proper indexes for performance"
```

### Migration Creation

```markdown
"Using Database-Agent.md as guidance, create a migration to add a 'Description'
field to the House table.

Context:

- Field should be optional (nullable)
- Max length 500 characters
- Include proper indexing if needed for search
- Follow our migration naming conventions"
```

### Query Optimization

```markdown
"Referring to Database-Agent.md, optimize the temperature retrieval queries.
We're seeing slow performance when loading last 30 days of data.

Current issue:

- Query takes 3+ seconds for houses with many rooms
- Need to maintain data accuracy
- Consider pagination or date-based partitioning"
```

---

## 🧪 Testing-Agent Examples

### Comprehensive Test Suite

```markdown
"Please refer to Testing-Agent.md and create a complete test suite for the
new temperature statistics endpoint.

Requirements:

- Unit tests for controller and service layer
- Integration tests with test database
- Mock external dependencies
- Test edge cases (invalid dates, no data scenarios)
- Achieve 90%+ coverage"
```

### Component Testing

```markdown
"Using Testing-Agent.md as context, create tests for the RoomTemperatureDialog component.

Test scenarios needed:

- Component renders correctly
- Handles loading states
- Displays error messages properly
- Makes correct API calls
- Handles user interactions (open/close)"
```

---

## 🐳 Infrastructure-Agent Examples

### Docker Enhancement

```markdown
"Please refer to Infrastructure-Agent.md and add health checks to all services
in our Docker Compose setup.

Requirements:

- Proper health endpoints for each service
- Database connectivity checks
- Graceful startup/shutdown handling
- Update docker-compose.yml accordingly"
```

### Environment Configuration

```markdown
"Using Infrastructure-Agent.md as guidance, set up different configuration
profiles for development, staging, and production environments.

Current need:

- Different database connections per environment
- API key management
- Logging level configuration
- Security settings per environment"
```

---

## 🔄 Multi-Agent Workflows

### Complex Feature Implementation

For features spanning multiple domains, orchestrate through the Master Agent:

```markdown
"I need to implement a new feature: 'Temperature Alerts System'

This feature should:

1. Allow users to set temperature thresholds per room
2. Send real-time notifications when thresholds are exceeded
3. Display alert history and statistics
4. Work across our current microservices architecture

Please provide an implementation plan that coordinates across frontend, backend,
and database changes, then delegate specific tasks to appropriate specialized agents."
```

The Master Agent will then:

1. **Analyze** the full-stack requirements
2. **Design** the overall architecture
3. **Create implementation plan** with clear phases
4. **Delegate specific tasks** to specialized agents
5. **Provide integration guidance** between components

---

## 📝 Best Practices

### ✅ Do This

- **Start with context**: Always mention which agent file to reference
- **Be specific**: Provide current file paths, exact requirements
- **Include constraints**: Mention existing patterns, performance needs
- **Provide context**: Explain why you're making the change
- **Reference current state**: Mention recent changes or current issues

### ❌ Avoid This

- **Vague requests**: "Make the app better"
- **Mixed domains**: Asking Frontend-Agent about database design
- **No context**: Not mentioning current file structure or patterns
- **Skip agent reference**: Not specifying which agent to use
- **Assume knowledge**: Not providing current state or recent changes

### 🎯 Request Template

```markdown
[AGENT SELECTION]
"Please refer to [Agent-Name].md and..."

[SPECIFIC TASK]  
"Create/modify/optimize [specific component/feature]..."

[REQUIREMENTS]
"Requirements:

- [Specific requirement 1]
- [Specific requirement 2]
- [Performance/integration needs]"

[CONTEXT]
"Current context:

- Files involved: [specific paths]
- Recent changes: [what's been done recently]
- Current issue: [what problem you're solving]"
```

---

## 🚀 Advanced Usage

### Agent Chaining

For complex workflows, you can chain agents:

```markdown
1. "Master Agent: Design architecture for feature X"
2. "Database-Agent: Create schema based on Master Agent's design"
3. "Backend-Agent: Implement APIs using the new schema"
4. "Frontend-Agent: Create UI components for the new APIs"
5. "Testing-Agent: Create comprehensive tests for the new feature"
6. "Infrastructure-Agent: Update deployment for the new feature"
```

### Context Preservation

Each agent maintains project context, so you can have ongoing conversations:

```markdown
First request: "Frontend-Agent: Create component X"
Follow-up: "Now update that component to handle error state Y"
Next: "Add loading spinner to the component we just created"
```

---

## 📊 Success Metrics

You'll know the Agent system is working well when:

- ✅ **Consistency**: All components follow established patterns
- ✅ **Efficiency**: Less time spent explaining context
- ✅ **Quality**: Code follows best practices automatically
- ✅ **Maintainability**: Changes don't break existing patterns
- ✅ **Scalability**: Easy to add new features using existing patterns

---

_Last Updated: September 29, 2025_
_For questions or improvements, update this guide as patterns evolve_
