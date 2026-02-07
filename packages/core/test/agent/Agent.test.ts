import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Agent } from "../../src/agent/Agent.js";
import { Tool } from "../../src/chat/Tool.js";
import { z } from "zod";
import { NodeLLM } from "../../src/llm.js";
import { ChatResponseString } from "../../src/chat/ChatResponse.js";
import { ThinkingResult } from "../../src/providers/Provider.js";

// Mock Tool
class MockTool extends Tool {
  name = "mock_tool";
  description = "A mock tool";
  schema = z.object({ value: z.string() });
  async execute({ value }: { value: string }) {
    return `Processed: ${value}`;
  }
}

// Mock Tool that throws
class ErrorTool extends Tool {
  name = "error_tool";
  description = "A tool that throws";
  schema = z.object({});
  async execute() {
    throw new Error("Tool failure");
  }
}

// Mock Chat implementation to avoid actual LLM calls
const mockAsk = vi.fn();
const mockStream = vi.fn();
const mockWithTools = vi.fn();
const mockWithInstructions = vi.fn();
const mockWithSchema = vi.fn();
const mockOnToolCallStart = vi.fn();
const mockOnToolCallEnd = vi.fn();
const mockOnToolCallError = vi.fn();
const mockOnEndMessage = vi.fn();
const mockBeforeRequest = vi.fn();

// Mock LLM
vi.mock("../../src/llm.js", () => ({
  NodeLLM: {
    chat: vi.fn(() => ({
      ask: mockAsk,
      stream: mockStream,
      withTools: mockWithTools,
      withInstructions: mockWithInstructions,
      withSchema: mockWithSchema,
      onToolCallStart: mockOnToolCallStart,
      onToolCallEnd: mockOnToolCallEnd,
      onToolCallError: mockOnToolCallError,
      onEndMessage: mockOnEndMessage,
      beforeRequest: mockBeforeRequest,
      history: [],
      modelId: "mock-model",
      totalUsage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 }
    }))
  },
  NodeLLMCore: class {}
}));

describe("Agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration & Instantiation", () => {
    class TestAgent extends Agent {
      static model = "gpt-4o";
      static instructions = "Test instructions";
      static tools = [MockTool];
      static temperature = 0.5;
    }

    it("should initialize with static configuration", () => {
      new TestAgent();
      expect(NodeLLM.chat).toHaveBeenCalledWith(
        "gpt-4o",
        expect.objectContaining({
          temperature: 0.5
        })
      );
      expect(mockWithInstructions).toHaveBeenCalledWith("Test instructions");
      expect(mockWithTools).toHaveBeenCalledWith([MockTool]);
    });

    it("should allow overrides in constructor", () => {
      new TestAgent({ model: "claude-3", temperature: 0.1 });
      expect(NodeLLM.chat).toHaveBeenCalledWith(
        "claude-3",
        expect.objectContaining({
          temperature: 0.1
        })
      );
    });
  });

  describe("Static Execution API", () => {
    class ExecAgent extends Agent {
      static model = "gpt-4o";
    }

    it("static ask() should assume default config and call chat.ask", async () => {
      mockAsk.mockResolvedValue(new ChatResponseString("output", {} as any, "model", "provider"));

      const result = await ExecAgent.ask("Hello");

      expect(NodeLLM.chat).toHaveBeenCalledWith("gpt-4o", expect.any(Object));
      expect(mockAsk).toHaveBeenCalledWith("Hello", undefined);
      expect(result.toString()).toBe("output");
    });

    it("static stream() should call chat.stream", async () => {
      const mockIterator = {
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ done: true, value: undefined })
        })
      };
      mockStream.mockReturnValue(mockIterator);

      const stream = ExecAgent.stream("Stream me");
      expect(mockStream).toHaveBeenCalledWith("Stream me", undefined);
      expect(stream).toBe(mockIterator);
    });
  });

  describe("Telemetry Hooks", () => {
    class TelemetryAgent extends Agent {
      static model = "gpt-4o";

      static onThinking = vi.fn();
      static onToolStart = vi.fn();
      static onToolEnd = vi.fn();
      static onToolError = vi.fn();
      static onComplete = vi.fn();
      static onStart = vi.fn();
    }

    it("wires up telemetry hooks in constructor", () => {
      new TelemetryAgent();
      expect(mockOnToolCallStart).toHaveBeenCalled();
      expect(mockOnToolCallEnd).toHaveBeenCalled();
      expect(mockOnToolCallError).toHaveBeenCalled();
      expect(mockOnEndMessage).toHaveBeenCalled();
      // onStart is wired via beforeRequest (which isn't mocked explicitly in the list above but let's check property access or call)
    });

    it("triggers onThinking and onComplete via onEndMessage callback", async () => {
      new TelemetryAgent();

      // Get the callback registered to onEndMessage
      const callback = mockOnEndMessage.mock.calls[0][0];

      const mockResponse = {
        thinking: { text: "I am thinking" } as ThinkingResult,
        content: "Done"
      } as ChatResponseString;

      await callback(mockResponse);

      expect(TelemetryAgent.onThinking).toHaveBeenCalledWith(
        { text: "I am thinking" },
        mockResponse
      );
      expect(TelemetryAgent.onComplete).toHaveBeenCalledWith(mockResponse);
    });

    it("triggers onToolStart via onToolCallStart callback", async () => {
      new TelemetryAgent();
      const callback = mockOnToolCallStart.mock.calls[0][0];
      const toolCall = { id: "1", function: { name: "test" } };

      await callback(toolCall);
      expect(TelemetryAgent.onToolStart).toHaveBeenCalledWith(toolCall);
    });

    it("triggers onToolEnd via onToolCallEnd callback", async () => {
      new TelemetryAgent();
      const callback = mockOnToolCallEnd.mock.calls[0][0];
      const toolCall = { id: "1" };
      const result = "success";

      await callback(toolCall, result);
      expect(TelemetryAgent.onToolEnd).toHaveBeenCalledWith(toolCall, result);
    });

    it("triggers onToolError via onToolCallError callback", async () => {
      new TelemetryAgent();
      const callback = mockOnToolCallError.mock.calls[0][0];
      const toolCall = { id: "1" };
      const error = new Error("fail");

      await callback(toolCall, error);
      expect(TelemetryAgent.onToolError).toHaveBeenCalledWith(toolCall, error);
    });

    it("triggers onStart via beforeRequest", () => {
      new TelemetryAgent();

      expect(mockBeforeRequest).toHaveBeenCalled();
    });
  });
});
