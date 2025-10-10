### 1. Sliding Window Approach

```
Time →  [Msg1][Msg2][Msg3][Msg4][Msg5][Msg6][Msg7][Msg8]
                ↓
Window: [────────────────Context Window────────────────]
                ↓
As context grows, older messages are compressed or removed:
Window: [Summary][Msg4][Msg5][Msg6][Msg7][Msg8][New]
```

### 3. Context Fragmentation Risk

When context is compacted, information can become fragmented:

```
Original Context:
"We established that MSW handlers should use enableDelay: false
for tests, and database cleanup should use clearDatabase() only,
not forceResetDatabase(). This was decided in the testing
optimization phase."

After Compaction:
"Use enableDelay: false and clearDatabase()."

Lost Information:
- Why these decisions were made
- What alternatives were considered
- Context of the testing optimization phase
```

## Compaction and Truncation

### 1. Compaction Triggers

Context compaction occurs when:

- **Token limit approached** (typically at 80-90% capacity)
- **New content needs space** (files, messages, tool outputs)
- **Context quality degrades** (too much outdated information)

### 2. Compaction Methods

#### A. Summarization

```
Before: [10,000 tokens of detailed conversation]
After: [1,000 token summary of key decisions and context]
Compression Ratio: 10:1
Information Loss: Medium
```

#### B. Truncation

```
Before: [Full file contents: 15,000 tokens]
After: [First 5,000 tokens + "...content truncated..."]
Compression Ratio: 3:1
Information Loss: High (missing middle/end content)
```

#### C. Selective Removal

```
Before: [Multiple file contents, conversations, tool outputs]
After: [Keep most recent and relevant, remove outdated]
Compression Ratio: Variable
Information Loss: Low (targeted removal)
```

### 3. Compaction Decision Tree

```
Start Context Compaction
├── Is there outdated historical context?
│   ├── Yes → Remove oldest non-critical messages
│   └── No → Continue
├── Are there redundant file contents?
│   ├── Yes → Keep most recent versions only
│   └── No → Continue
├── Can conversations be summarized?
│   ├── Yes → Summarize while preserving key decisions
│   └── No → Continue
└── Last resort → Truncate least critical current content
```

## Impact on Result Consistency

### 1. Types of Consistency Loss

#### Pattern Forgetting

```
Early in conversation: "Use enableDelay: false for all tests"
After compaction: AI might revert to enableDelay: true
Result: Inconsistent test configuration
```

#### Architecture Drift

```
Established: "Use React Context for state management"
After compaction: AI might suggest Redux or other patterns
Result: Inconsistent architecture decisions
```

#### Convention Inconsistency

```
Established: "File naming: parentComponent + descriptive suffix"
After compaction: AI might use different naming patterns
Result: Inconsistent codebase organization
```

### 2. Consistency Degradation Patterns

#### Gradual Degradation

```
Quality Level
     ↑
100% |████░░░░░░░░░░░░░░░░░░░░░░
 80% |██████████░░░░░░░░░░░░░░░░
 60% |████████████████░░░░░░░░░░
 40% |██████████████████████░░░░
 20% |████████████████████████░░
     └─────────────────────────→
       Time / Token Usage
```

#### Sudden Drops

```
Quality Level
     ↑
100% |██████████████████████████
 80% |██████████████████████████
 60% |██████████████████████████
 40% |█████████░░░░░░░░░░░░░░░░░ ← Compaction Event
 20% |█████████░░░░░░░░░░░░░░░░░
     └─────────────────────────→
       Time / Compaction Events
```

### 3. Impact Severity by Context Type

| Context Type           | Impact Level | Recovery Difficulty |
| ---------------------- | ------------ | ------------------- |
| Code Patterns          | High         | Medium              |
| Architecture Decisions | Very High    | Hard                |
| File Locations         | Medium       | Easy                |
| Variable Names         | Low          | Easy                |
| Business Logic         | High         | Hard                |
| Testing Patterns       | Medium       | Medium              |
