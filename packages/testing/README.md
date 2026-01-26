# @node-llm/testing 🌑🟢🧪

Deterministic testing infrastructure for NodeLLM-powered AI systems. Built for engineers who prioritize **Boring Solutions**, **Security**, and **High-Fidelity Feedback Loops**.

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

### Fluent Mocking

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

---

## ⚙️ Configuration

| Env Variable       | Description                                                | Default          |
| ------------------ | ---------------------------------------------------------- | ---------------- |
| `VCR_MODE`         | `record`, `replay`, `auto`, or `passthrough`               | `auto`           |
| `VCR_CASSETTE_DIR` | Base directory for cassettes                               | `test/cassettes` |
| `CI`               | When true, VCR prevents recording and forces exact matches | (Auto-detected)  |

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

## 🏛️ Architecture Contract

- **No Side Effects**: Mocks and VCR interceptors are automatically cleared after each test turn.
- **Deterministic**: The same input MUST always yield the same output in Replay mode.
- **Explicit > Implicit**: We prefer explicit mock definitions over complex global state.
