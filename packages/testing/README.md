# @node-llm/testing 🌑🟢🧪

Deterministic testing infrastructure for NodeLLM-powered AI systems. Built for engineers who prioritize **Boring Solutions**, **Security**, and **High-Fidelity Feedback Loops**.

> 💡 **What is High-Fidelity?**
> Your tests exercise the same execution path, provider behavior, and tool orchestration as production — without live network calls.

**Framework Support**: ✅ Vitest (native) | ✅ Jest (compatible) | ✅ Any test framework (core APIs)

---

## 🧭 The Philosophy: Two-Tier Testing

We believe AI testing should never be flaky or expensive. We provide two distinct strategies:

### 1. VCR (Integration Testing) 📼

**When to use**: To verify your system works with real LLM responses without paying for every test run.

- **High Fidelity**: Captures the exact raw response from the provider.
- **Security First**: Automatically scrubs API Keys and sensitive PII from "cassettes".
- **CI Safe**: Fails-fast in CI if a cassette is missing, preventing accidental live API calls.

### 2. Mocker (Unit Testing) 🎭

**When to use**: To test application logic, edge cases (errors, rate limits), and rare tool-calling paths.

- **Declarative**: Fluent API to define expected prompts and responses.
- **Multimodal**: Native support for `chat`, `embed`, `paint`, `transcribe`, and `moderate`.
- **Streaming**: Simulate token-by-token delivery to test real-time UI logic.

---

## 📼 VCR Usage

### Basic Interaction

Wrap your tests in `withVCR` to automatically record interactions the first time they run.

```typescript
import { withVCR } from "@node-llm/testing";

it(
  "calculates sentiment correctly",
  withVCR(async () => {
    const result = await mySentimentAgent.run("I love NodeLLM!");
    expect(result.sentiment).toBe("positive");
  })
);
```

### Hierarchical Organization (Rails Mode) 📂

Organize your cassettes into nested subfolders to match your test suite structure.

```typescript
import { describeVCR, withVCR } from "@node-llm/testing";

describeVCR("Authentication", () => {
  describeVCR("Login", () => {
    it(
      "logs in successfully",
      withVCR(async () => {
        // Cassette saved to: .llm-cassettes/authentication/login/logs-in-successfully.json
      })
    );
  });
});
```

### Security & Scrubbing 🛡️

The VCR automatically redacts `api_key`, `authorization`, and other sensitive headers. You can add custom redaction:

```typescript
withVCR({
  scrub: (data) => data.replace(/SSN: \d+/g, "[REDACTED_SSN]")
}, async () => { ... });
```

---

## 🎭 Mocker Usage

### Fluent, Explicit Mocking

Define lightning-fast, zero-network tests for your agents.

```typescript
import { mockLLM } from "@node-llm/testing";

const mocker = mockLLM();

// Exact match
mocker.chat("Ping").respond("Pong");

// Regex match
mocker.chat(/hello/i).respond("Greetings!");

// Simulate a Tool Call
mocker.chat("What's the weather?").callsTool("get_weather", { city: "London" });

// Simulate Multiple Tool Calls (for agents)
mocker.chat(/book flight/).callsTools([
  { name: "search_flights", args: { from: "NYC", to: "LAX" } },
  { name: "check_weather", args: { city: "LAX" } }
]);
```

### Streaming Mocks 🌊

Test your streaming logic by simulating token delivery.

```typescript
mocker.chat("Tell a story").stream(["Once ", "upon ", "a ", "time."]);
```

### Multimodal Mocks 🎨

```typescript
mocker.paint(/a cat/i).respond({ url: "https://mock.com/cat.png" });
mocker.embed("text").respond({ vectors: [[0.1, 0.2, 0.3]] });
```

### Sequence Mocks (Multi-turn) 🔄

For testing agentic conversations with multiple turns:

```typescript
// Each call consumes the next response
mocker
  .chat(/help/)
  .sequence(["What do you need help with?", "Here's the answer.", "Anything else?"]);

const res1 = await agent.ask("Help me"); // → "What do you need help with?"
const res2 = await agent.ask("Help more"); // → "Here's the answer."
const res3 = await agent.ask("Help again"); // → "Anything else?"
```

### Limited Matches with times() ⏱️

```typescript
// First 2 calls return "Try again", then falls through
mocker.chat(/retry/).times(2).respond("Try again");
mocker.chat(/retry/).respond("Giving up");
```

### Call Verification & History 🕵️‍♀️

Inspect what requests were sent to your mock, enabling "spy" style assertions.

```typescript
// 1. Check full history
const history = mocker.history;
expect(history.length).toBe(1);

// 2. Filter by method
const chats = mocker.getCalls("chat");
expect(chats[0].args[0].messages[0].content).toContain("Hello");

// 3. Get the most recent call
const lastEmbed = mocker.getLastCall("embed");
expect(lastEmbed.args[0].input).toBe("text to embed");

// 4. Reset history (keep mocks)
mocker.resetHistory();

// 5. Snapshot valid request structures
expect(mocker.getLastCall().prompt).toMatchSnapshot();
```

---

## 🛣️ Decision Tree: VCR vs Mocker

Choose the right tool for your test:

```
Does your test need to verify behavior against REAL LLM responses?
├─ YES → Use VCR (integration testing)
│   ├─ Do you need to record the first time and replay afterward?
│   │   └─ YES → Use VCR in "record" or "auto" mode
│   ├─ Are you testing in CI/CD? (No live API calls allowed)
│   │   └─ YES → Set VCR_MODE=replay in CI
│   └─ Need custom scrubbing for sensitive data?
│       └─ YES → Use withVCR({ scrub: ... })
│
└─ NO → Use Mocker (unit testing)
    ├─ Testing error handling, edge cases, or rare paths?
    │   └─ YES → Mock the error with mocker.chat(...).respond({ error: ... })
    ├─ Testing streaming token delivery?
    │   └─ YES → Use mocker.chat(...).stream([...])
    └─ Testing tool-calling paths without real tools?
        └─ YES → Use mocker.chat(...).callsTool(name, params)
```

**Quick Reference**:

- **VCR**: Database queries, API calls, real provider behavior, network latency
- **Mocker**: Business logic, UI interactions, error scenarios, tool orchestration

### At-a-Glance Comparison

| Use Case                | VCR               | Mocker |
| ----------------------- | ----------------- | ------ |
| Real provider behavior  | ✅                | ❌     |
| CI-safe (no live calls) | ✅ (after record) | ✅     |
| Zero network overhead   | ❌ (first run)    | ✅     |
| Error simulation        | ⚠️ (record real)  | ✅     |
| Tool orchestration      | ✅                | ✅     |
| Streaming tokens        | ✅                | ✅     |

---

## ⚙️ Configuration

### Environment Variables

| Env Variable       | Description                                                | Default          |
| ------------------ | ---------------------------------------------------------- | ---------------- |
| `VCR_MODE`         | `record`, `replay`, `auto`, or `passthrough`               | `auto`           |
| `VCR_CASSETTE_DIR` | Base directory for cassettes                               | `test/cassettes` |
| `CI`               | When true, VCR prevents recording and forces exact matches | (Auto-detected)  |

### Programmatic Configuration

Configure VCR globally for all instances in your test suite:

```typescript
import { configureVCR, resetVCRConfig } from "@node-llm/testing";

// Before all tests
beforeAll(() => {
  configureVCR({
    // Custom keys to redact in cassettes
    sensitiveKeys: ["api_key", "bearer_token", "custom_secret"],

    // Custom regex patterns to redact
    sensitivePatterns: [/api_key=[\w]+/g, /Bearer ([\w.-]+)/g]
  });
});

// After all tests
afterAll(() => {
  resetVCRConfig();
});
```

### Per-Instance Configuration

Override global settings for a specific VCR instance:

```typescript
withVCR(
  {
    mode: "replay",
    cassettesDir: "./test/fixtures",
    scrub: (data) => data.replace(/email=\S+@/, "email=[REDACTED]@"),
    sensitiveKeys: ["session_token"]
  },
  async () => {
    // Test runs here
  }
);
```

});

````

---

## 🧪 Framework Integration

### Vitest (Native Support)

Vitest is the primary test framework with optimized helpers:

```typescript
import { it, describe } from "vitest";
import { mockLLM, withVCR, describeVCR } from "@node-llm/testing";

describeVCR("Payments", () => {
  it(
    "processes successfully",
    withVCR(async () => {
      // ✨ withVCR auto-detects test name ("processes successfully")
      // ✨ describeVCR auto-manages scopes
    })
  );
});
```

### Jest Compatibility

All core APIs work with Jest. The only difference: `withVCR()` can't auto-detect test names, so provide it manually:

```typescript
import { describe, it } from "@jest/globals";
import { mockLLM, setupVCR, describeVCR } from "@node-llm/testing";

describeVCR("Payments", () => {
  it("processes successfully", async () => {
    // ✅ describeVCR works with Jest (framework-agnostic)
    // ⚠️ withVCR doesn't work here (needs Vitest's expect.getState())
    // ✅ Use setupVCR instead:
    const vcr = setupVCR("processes", { mode: "record" });

    const mocker = mockLLM();  // ✅ works with Jest
    mocker.chat("pay").respond("done");

    // Test logic here

    await vcr.stop();
  });
});
```

### Framework Support Matrix

| API | Vitest | Jest | Any Framework |
|-----|--------|------|---------------|
| `mockLLM()` | ✅ | ✅ | ✅ |
| `describeVCR()` | ✅ | ✅ | ✅ |
| `setupVCR()` | ✅ | ✅ | ✅ |
| `withVCR()` | ✅ (auto name) | ⚠️ (manual name) | ⚠️ (manual name) |
| Mocker class | ✅ | ✅ | ✅ |
| VCR class | ✅ | ✅ | ✅ |

**Only `withVCR()` is Vitest-specific** because it auto-detects test names. All other APIs are framework-agnostic.

### Any Test Framework

Using raw classes for maximum portability:

```typescript
import { Mocker, VCR } from "@node-llm/testing";

// Mocker - works everywhere
const mocker = new Mocker();
mocker.chat("hello").respond("hi");

// VCR - works everywhere
const vcr = new VCR("test-name", { mode: "record" });
// ... run test ...
await vcr.stop();
```

---

## 🚨 Error Handling & Debugging

### VCR Common Issues

#### Missing Cassette Error

**Error**: `Error: Cassette file not found`

**Cause**: VCR is in `replay` mode but the cassette doesn't exist yet.

**Solution**:
```typescript
// Either: Record it first
VCR_MODE=record npm test

// Or: Use auto mode (records if missing, replays if exists)
VCR_MODE=auto npm test

// Or: Explicitly set mode
withVCR({ mode: "record" }, async () => { ... });
````

#### Cassette Mismatch Error

**Error**: `AssertionError: No interaction matched the request`

**Cause**: Your code is making a request that doesn't match any recorded interaction.

**Solution**:

```typescript
// 1. Debug what request was made
const mocker = mockLLM();
mocker.onAnyRequest((req) => {
  console.log("Unexpected request:", req.prompt);
});

// 2. Re-record the cassette
rm -rf .llm-cassettes/your-test
VCR_MODE=record npm test -- your-test

// 3. Commit the updated cassette to git
```

#### Sensitive Data Not Scrubbed

**Error**: API keys appear in cassette JSON

**Solution**: Add custom scrubbing rules

```typescript
import { configureVCR } from "@node-llm/testing";

configureVCR({
  sensitiveKeys: ["x-api-key", "authorization", "custom_token"],
  sensitivePatterns: [/Bearer ([\w.-]+)/g]
});
```

### Mocker Common Issues

#### Strict Mode Enforcement

**Error**: `Error: No mock defined for prompt: "unexpected question"`

**Cause**: Your code asked a question you didn't mock in strict mode.

**Solution**:

```typescript
// Either: Add the missing mock
mocker.chat("unexpected question").respond("mocked response");

// Or: Disable strict mode
const mocker = mockLLM({ strict: false });
// Now unmocked requests return generic "I don't have a response" message

// Or: Debug what's being asked
mocker.onAnyRequest((req) => {
  console.error("Unmatched request:", req.prompt);
  throw new Error(`Add mock for: mocker.chat("${req.prompt}").respond(...)`);
});
```

#### Stream Simulation Issues

**Error**: `TypeError: Cannot read property 'Symbol(Symbol.iterator)' of undefined`

**Cause**: Stream mock not properly yielding tokens.

**Solution**:

```typescript
// Correct: Array of tokens
mocker.chat("story").stream(["Once ", "upon ", "a ", "time."]);

// Incorrect: String instead of array
mocker.chat("story").stream("Once upon a time."); // ❌ Wrong!
```

### Debug Information

Get detailed insight into what mocks are registered:

```typescript
const mocker = mockLLM();
mocker.chat("hello").respond("hi");
mocker.embed("text").respond({ vectors: [[0.1, 0.2]] });

const debug = mocker.getDebugInfo();
console.log(debug);
// Output:
// {
//   totalMocks: 2,
//   methods: ["chat", "embed"]
// }
```

---

## 📚 Type Documentation

### VCROptions

```typescript
interface VCROptions {
  // Recording/Replay behavior
  mode?: "record" | "replay" | "auto" | "passthrough";
  cassettesDir?: string;

  // Security & Scrubbing
  sensitiveKeys?: string[];
  sensitivePatterns?: RegExp[];
  scrub?: (data: string) => string;
}
```

### MockerOptions

```typescript
interface MockerOptions {
  // Enforce exact matching
  strict?: boolean;
}
```

### MockResponse

```typescript
interface MockResponse {
  // Simple text response
  content?: string;

  // Tool calling
  toolName?: string;
  toolParams?: Record<string, unknown>;

  // Error simulation
  error?: Error | string;

  // Streaming tokens
  tokens?: string[];

  // Generation metadata
  metadata?: {
    tokensUsed?: number;
    model?: string;
  };
}
```

### MockerDebugInfo

```typescript
interface MockerDebugInfo {
  // Total number of mocks defined
  totalMocks: number;

  // Array of unique method names used ("chat", "embed", etc.)
  methods: string[];
}
```

### MockCall

```typescript
interface MockCall {
  // The method name ("chat", "stream", etc.)
  method: string;

  // The arguments passed to the method
  args: unknown[];

  // Timestamp of the call
  timestamp: number;

  // Convenience prompt accessor (e.g. messages, input text)
  prompt?: unknown;
}
```

---

## 🏛️ Integration with @node-llm/orm

The testing tools operate at the `providerRegistry` level. This means they **automatically** intercept LLM calls made by the ORM layer.

### Pattern: Testing Database Persistence

When using `@node-llm/orm`, you can verify both the database state and the LLM response in a single test.

```typescript
import { withVCR } from "@node-llm/testing";
import { createChat } from "@node-llm/orm/prisma";

it(
  "saves the LLM response to the database",
  withVCR(async () => {
    // 1. Setup ORM Chat
    const chat = await createChat(prisma, llm, { model: "gpt-4" });

    // 2. Interaction (VCR intercepts the LLM call)
    await chat.ask("Hello ORM!");

    // 3. Verify DB state (standard Prisma/ORM assertions)
    const messages = await prisma.assistantMessage.findMany({
      where: { chatId: chat.id }
    });
ring a separate blog
    expect(messages).toHaveLength(2); // User + Assistant
    expect(messages[1].content).toBeDefined();
  })
);
```

### Pattern: Mocking Rare Logic

Use the `Mocker` to test how your application handles complex tool results or errors without setting up a real LLM.

```typescript
import { mockLLM } from "@node-llm/testing";

it("handles tool errors in ORM sessions", async () => {
  const mocker = mockLLM();
  mocker.chat("Search docs").respond({ error: new Error("DB Timeout") });

  const chat = await loadChat(prisma, llm, "existing-id");

  await expect(chat.ask("Search docs")).rejects.toThrow("DB Timeout");
});
```

---

## 🤖 Testing Agents & AgentSessions

When testing the Agent class or AgentSession (from `@node-llm/orm`), the same VCR and Mocker tools apply—they intercept at the provider level.

### VCR with Agents

```typescript
import { withVCR } from "@node-llm/testing";
import { SupportAgent } from "./agents/support-agent";

it(
  "answers support questions",
  withVCR(async () => {
    const agent = new SupportAgent();
    const response = await agent.ask("How do I reset my password?");

    expect(response.content).toContain("password");
  })
);
```

### Mocker with Agents

```typescript
import { mockLLM } from "@node-llm/testing";
import { SupportAgent } from "./agents/support-agent";

it("uses tools defined in agent class", async () => {
  const mocker = mockLLM();

  // Mock the tool call the agent will make
  mocker.chat(/password/).callsTool("search_docs", { query: "password reset" });
  mocker.chat().respond("To reset your password, go to Settings > Security.");

  const agent = new SupportAgent();
  const response = await agent.ask("How do I reset my password?");

  expect(response.content).toContain("Settings");
  expect(mocker.getCalls()).toHaveLength(2); // Tool call + final response
});
```

### Testing AgentSession Persistence

For `AgentSession` from `@node-llm/orm`, mock both the LLM and database:

```typescript
import { mockLLM } from "@node-llm/testing";

it("resumes session with history", async () => {
  const mocker = mockLLM();
  mocker.chat(/continue/).respond("As we discussed earlier...");

  // Create session with mocked LLM
  const session = await createAgentSession(prismaMock, llm, SupportAgent);

  // Resume later
  const loaded = await loadAgentSession(prismaMock, llm, SupportAgent, session.id);
  const response = await loaded.ask("Continue our chat");

  expect(response.content).toContain("discussed earlier");
});
```

---

## 🏛️ Architecture Contract

- **No Side Effects**: Mocks and VCR interceptors are automatically cleared after each test turn.
- **Deterministic**: The same input MUST always yield the same output in Replay mode.
- **Explicit > Implicit**: We prefer explicit mock definitions over complex global state.

---

## 🔧 Troubleshooting

### SyntaxError: Unexpected identifier 'assert'

If you encounter this error in CI (especially with Node.js 22.x), add the following to your `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    server: {
      deps: {
        inline: [/@node-llm/]
      }
    }
  }
});
```

This tells Vitest to bundle `@node-llm` packages instead of loading them as external modules, avoiding JSON import assertion compatibility issues across Node.js versions.
