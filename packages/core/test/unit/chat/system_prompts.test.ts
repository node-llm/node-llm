import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";

describe("Chat System Prompts", () => {
  it("adds instructions correctly", async () => {
    const provider = new FakeProvider(["Response"]);
    const chat = new Chat(provider, "test-model");

    chat.withInstructions("Be helpful");

    await chat.ask("Hello");

    expect(chat.history[0]).toMatchObject({
      role: "system",
      content: "Be helpful",
    });
  });

  it("appends instructions by default", async () => {
    const provider = new FakeProvider(["Response"]);
    const chat = new Chat(provider, "test-model");

    chat.withInstructions("First instruction");
    chat.withInstructions("Second instruction");

    await chat.ask("Hello");

    expect(chat.history[0]).toMatchObject({
      role: "system",
      content: "First instruction",
    });
    expect(chat.history[1]).toMatchObject({
      role: "system",
      content: "Second instruction",
    });
  });

  it("replaces instructions when replace: true is used", async () => {
    const provider = new FakeProvider(["Response", "Response 2"]);
    const chat = new Chat(provider, "test-model");

    chat.withInstructions("First instruction");
    await chat.ask("Question 1");

    // Replace
    chat.withInstructions("New instruction", { replace: true });
    await chat.ask("Question 2");

    // Check final state of history
    // History should contain: 
    // 0: New instruction (system)
    // 1: System prompt (First instruction) - wait, replace removes PREVIOUS system messages.
    // Let's verify expectations.
    
    // Initial state: [System(First), User(Q1), Assistant(R1)]
    // After replace:
    // It filters out old system messages.
    // So [User(Q1), Assistant(R1)]
    // Then unshifts New Instruction.
    // So [System(New), User(Q1), Assistant(R1), ... new stuff]
    
    // Find all system messages
    const systemMessages = chat.history.filter(m => m.role === "system");
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0].content).toBe("New instruction");
    
    // Verify it's at the start
    expect(chat.history[0].role).toBe("system");
    expect(chat.history[0].content).toBe("New instruction");
  });

  it("supports withSystemPrompt alias", async () => {
    const provider = new FakeProvider(["Response"]);
    const chat = new Chat(provider, "test-model");
    
    chat.withSystemPrompt("Alias test");
    await chat.ask("Hello");
    
    expect(chat.history[0].content).toBe("Alias test");
  });
});
