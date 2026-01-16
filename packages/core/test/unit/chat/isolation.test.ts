import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";

describe("Chat Context Isolation", () => {
  it("isolates system instructions from user messages internally", async () => {
    const provider = new FakeProvider(["Reply"]);
    const chat = new Chat(provider, "fake-model");

    chat.withInstructions("Initial system rule");
    await chat.ask("User question");

    // The history should show them combined
    expect(chat.history).toHaveLength(3); // system, user, assistant
    expect(chat.history[0]!.role).toBe("system");
    expect(chat.history[1]!.role).toBe("user");

    // Internally we can verify the split by checking what was sent to provider
    const lastRequest = provider.lastRequest;
    expect(lastRequest?.messages).toHaveLength(2); // system + user
    expect(lastRequest?.messages[0]!.content).toBe("Initial system rule");
    expect(lastRequest?.messages[1]!.content).toBe("User question");
  });

  it("replaces system messages correctly in isolated storage", () => {
    const provider = new FakeProvider();
    const chat = new Chat(provider, "fake-model");

    chat.withInstructions("Rule 1");
    chat.withInstructions("Rule 2", { replace: true });

    expect(chat.history).toHaveLength(1);
    expect(chat.history[0]!.content).toBe("Rule 2");
  });

  it("extracts system/developer messages from initial options into isolated storage", () => {
    const provider = new FakeProvider();
    const chat = new Chat(provider, "fake-model", {
      messages: [
        { role: "system", content: "System rule" },
        { role: "user", content: "Hello" }
      ]
    });

    expect(chat.history).toHaveLength(2);
    expect(chat.history[0]!.role).toBe("system");
    expect(chat.history[1]!.role).toBe("user");
  });
});
