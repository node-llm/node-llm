# MCP Agent Flow Examples

This directory contains examples demonstrating different agent patterns using MCP tools with NodeLLM.

## Examples

### 1. `multi-tool-agent.ts` - Multi-Tool Agent Workflow

**When to use:** Complex tasks requiring multiple tools and reasoning across different data sources.

**Demonstrates:**
- Combining multiple MCP servers (filesystem + database)
- Tool namespacing (fs_, db_ prefixes)
- Sophisticated agent reasoning
- State management across multiple interactions
- Integration of different tool types

**Architecture:**
1. Discovers tools from multiple registries
2. Combines tools with prefixes to avoid conflicts
3. Uses a single Chat instance with all tools
4. Agent decides which tools to use for each objective

**Key Pattern:**
```typescript
const fsTools = await fsRegistry.discoverTools({ prefix: "fs_" });
const dbTools = await dbRegistry.discoverTools({ prefix: "db_" });
const allTools = [...fsTools, ...dbTools];
const chat = llm.chat("gpt-4o-mini").withTools(allTools);
```

**Use Cases:**
- Codebase analysis and documentation
- Data collection and processing pipelines
- File-based data transformations
- Complex analysis workflows

---

### 2. `step-agent.ts` - Step-by-Step Agent Pattern

**When to use:** Explicit workflow control where you want visibility and control over each agent step.

**Demonstrates:**
- Discrete step execution
- Execution tracking and history
- Clear reasoning traces
- State context passing between steps
- Agent pattern abstraction

**Architecture:**
1. `SimpleAgent` class manages step execution
2. Each step has explicit objectives and context
3. Tool usage is tracked per step
4. Results are accumulated for later reference
5. Summary generation after completion

**Key Pattern:**
```typescript
const agent = new SimpleAgent();
await agent.executeStep(chat, objective, context);
await agent.executeStep(chat, nextObjective, updatedContext);
console.log(agent.getSummary());
```

**Use Cases:**
- Data pipelines with checkpoints
- Iterative analysis and refinement
- Processes requiring audit trails
- Explainable AI workflows

---

## Key Differences

| Aspect | Multi-Tool | Step-by-Step |
|--------|-----------|--------------|
| **Tool Selection** | Agent chooses freely | Guided by step context |
| **Visibility** | Less explicit | High - each step tracked |
| **Control** | Emergent | Programmatic |
| **Complexity** | Higher flexibility | Structured workflow |
| **Use Case** | Autonomous reasoning | Orchestrated processes |

---

## Running the Examples

```bash
# Multi-tool agent
npx tsx agent-flow/multi-tool-agent.ts

# Step-by-step agent
npx tsx agent-flow/step-agent.ts
```

### Requirements
- `@modelcontextprotocol/server-filesystem` (via `npx -y`)
- `mcp-server-sqlite` (via `uvx`)
- OPENAI_API_KEY environment variable

---

## Extending These Patterns

### Add More Tools
```typescript
const newTools = await customRegistry.discoverTools({ prefix: "custom_" });
const allTools = [...existingTools, ...newTools];
```

### Create Custom Step Classes
```typescript
class DatabaseAgent extends SimpleAgent {
  async setupDatabase() { /* ... */ }
  async queryData() { /* ... */ }
  async generateReport() { /* ... */ }
}
```

### Add Tool Filtering
```typescript
const tools = await registry.discoverTools({
  filter: ["read_query", "write_query"],
  prefix: "db_"
});
```

---

## Best Practices

1. **Tool Namespacing**: Always use prefixes when combining multiple registries
2. **Error Handling**: Each step should have try-catch boundaries
3. **Context Passing**: Include relevant context in step objectives
4. **Cleanup**: Always close registries to free resources
5. **Tool Discovery**: Cache tool arrays - don't re-discover for each request
6. **Observability**: Log tool selections and results for debugging

---

## Agent vs Chat

- **Chat**: Single-turn tool interaction, returns final response
- **Agent**: Multi-step reasoning, tools selected automatically, complex decision-making
- **Pattern**: Use agents for tasks requiring multiple steps; use chat for single queries
