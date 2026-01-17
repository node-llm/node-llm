import { describe, it, expect } from "vitest";
import { NodeLLM } from "../../../src/index.js";
import { FakeProvider } from "../../fake-provider.js";

describe("Chat Aliases and Manual History", () => {
  const llm = NodeLLM.withProvider(new FakeProvider());

  it("should support .system() alias for withInstructions", async () => {
    const chat = llm.chat();
    chat.system("You are a helpful assistant");

    const response = await chat.ask("Hello");
    expect(response.content).toBeDefined();
  });

  it("should support .add() for manual history management", async () => {
    const chat = llm.chat();
    chat.add("user", "My name is Alice");
    chat.add("assistant", "Nice to meet you, Alice");

    const response = await chat.ask("What is my name?");
    expect(response.content).toBeDefined();
  });
});
