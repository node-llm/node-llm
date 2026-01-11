import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ToolExecutionMode } from "../../../src/constants.js";

describe("Tool Execution Modes", () => {
  const toolCallResponse = {
    content: "I'll check the weather.",
    tool_calls: [{
      id: "call_1",
      type: "function" as const,
      function: { name: "get_weather", arguments: '{"location":"London"}' }
    }]
  };

  const weatherTool = {
    type: "function" as const,
    function: { name: "get_weather", parameters: {} },
    handler: async () => "Sunny"
  };

  it("auto mode executes tool automatically (default)", async () => {
    const provider = new FakeProvider([toolCallResponse, "Final answer"]);
    const chat = new Chat(provider, "test");
    
    await chat.withTool(weatherTool).ask("Weather?");

    expect(chat.history.length).toBe(4); // User, Assistant (Plan), Tool Result, Assistant (Final)
    expect(chat.history[2].role).toBe("tool");
    expect(chat.history[2].content).toBe("Sunny");
  });

  it("dry-run mode does not execute tools", async () => {
    const provider = new FakeProvider([toolCallResponse, "Final answer"]);
    const chat = new Chat(provider, "test");
    
    const response = await chat
      .withTool(weatherTool)
      .withToolExecution(ToolExecutionMode.DRY_RUN)
      .ask("Weather?");

    expect(chat.history.length).toBe(2); // User, Assistant (Plan)
    expect(response.tool_calls).toHaveLength(1);
    expect(response.tool_calls![0].function.name).toBe("get_weather");
    // Verify no tool result in history
    expect(chat.history.some(m => m.role === "tool")).toBe(false);
  });

  it("confirm mode executes tool on approval", async () => {
    const provider = new FakeProvider([toolCallResponse, "Final answer"]);
    const chat = new Chat(provider, "test");
    
    const onConfirm = vi.fn().mockResolvedValue(true);
    
    await chat
      .withTool(weatherTool)
      .withToolExecution(ToolExecutionMode.CONFIRM)
      .onConfirmToolCall(onConfirm)
      .ask("Weather?");

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(chat.history.some(m => m.role === "tool" && m.content === "Sunny")).toBe(true);
  });

  it("confirm mode skips tool on rejection", async () => {
    const provider = new FakeProvider([toolCallResponse, "Final answer"]);
    const chat = new Chat(provider, "test");
    
    const onConfirm = vi.fn().mockResolvedValue(false); // REJECT
    
    await chat
      .withTool(weatherTool)
      .withToolExecution(ToolExecutionMode.CONFIRM)
      .onConfirmToolCall(onConfirm)
      .ask("Weather?");

    expect(onConfirm).toHaveBeenCalledTimes(1);
    // Should have a cancellation message in history
    expect(chat.history.some(m => m.role === "tool" && m.content === "Action cancelled by user.")).toBe(true);
  });

  describe("Streaming", () => {
    it("dry-run mode does not execute tools in stream", async () => {
      const provider = new FakeProvider([toolCallResponse, "Final answer"]);
      const chat = new Chat(provider, "test");
      
      const streamer = chat
        .withTool(weatherTool)
        .withToolExecution(ToolExecutionMode.DRY_RUN)
        .stream("Weather?");

      for await (const _chunk of streamer) {
        // Just consume
      }

      // Should stop after User and Assistant (Plan)
      expect(chat.history.length).toBe(2);
      expect(chat.history.some(m => m.role === "tool")).toBe(false);
    });

    it("confirm mode works in stream", async () => {
      const provider = new FakeProvider([toolCallResponse, "Final answer"]);
      const chat = new Chat(provider, "test");
      
      const onConfirm = vi.fn().mockResolvedValue(true);
      
      const streamer = chat
        .withTool(weatherTool)
        .withToolExecution(ToolExecutionMode.CONFIRM)
        .onConfirmToolCall(onConfirm)
        .stream("Weather?");

      for await (const _chunk of streamer) {
        // Just consume
      }

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(chat.history.some(m => m.role === "tool" && m.content === "Sunny")).toBe(true);
    });
  });
});
