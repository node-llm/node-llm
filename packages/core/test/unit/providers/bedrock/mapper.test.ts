import { describe, it, expect } from "vitest";
import {
  convertMessages,
  convertTools,
  buildConverseRequest
} from "../../../../src/providers/bedrock/mapper.js";
import { Message } from "../../../../src/chat/Message.js";
import { ToolDefinition } from "../../../../src/chat/Tool.js";

describe("Bedrock Mapper", () => {
  describe("convertMessages", () => {
    it("should convert user message to Bedrock format", () => {
      const messages: Message[] = [{ role: "user", content: "Hello" }];

      const result = convertMessages(messages);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual({
        role: "user",
        content: [{ text: "Hello" }]
      });
    });

    it("should convert assistant message to Bedrock format", () => {
      const messages: Message[] = [{ role: "assistant", content: "Hi there!" }];

      const result = convertMessages(messages);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual({
        role: "assistant",
        content: [{ text: "Hi there!" }]
      });
    });

    it("should extract system messages to top-level system field", () => {
      const messages: Message[] = [
        { role: "system", content: "You are helpful." },
        { role: "user", content: "Hello" }
      ];

      const result = convertMessages(messages);

      expect(result.system).toEqual([{ text: "You are helpful." }]);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
    });

    it("should handle assistant messages with tool calls", () => {
      const messages: Message[] = [
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call_123",
              type: "function",
              function: {
                name: "get_weather",
                arguments: '{"location":"London"}'
              }
            }
          ]
        }
      ];

      const result = convertMessages(messages);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toHaveLength(1); // toolUse only
      expect(result.messages[0].content[0]).toEqual({
        toolUse: {
          toolUseId: "call_123",
          name: "get_weather",
          input: { location: "London" }
        }
      });
    });

    it("should convert tool result messages", () => {
      const messages: Message[] = [
        {
          role: "tool",
          tool_call_id: "call_123",
          content: "Weather: Sunny, 22°C"
        }
      ];

      const result = convertMessages(messages);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
      expect(result.messages[0].content[0]).toEqual({
        toolResult: {
          toolUseId: "call_123",
          content: [{ text: "Weather: Sunny, 22°C" }],
          status: "success"
        }
      });
    });

    it("should handle tool errors", () => {
      const messages: Message[] = [
        {
          role: "tool",
          tool_call_id: "call_456",
          content: "Error: Location not found",
          isError: true
        }
      ];

      const result = convertMessages(messages);

      expect(result.messages[0].content[0]).toEqual({
        toolResult: {
          toolUseId: "call_456",
          content: [{ text: "Error: Location not found" }],
          status: "error"
        }
      });
    });
  });

  describe("convertTools", () => {
    it("should return undefined for empty tools", () => {
      expect(convertTools([])).toBeUndefined();
      expect(convertTools(undefined)).toBeUndefined();
    });

    it("should convert tools to Bedrock format", () => {
      const tools: ToolDefinition[] = [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the weather for a location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" }
              },
              required: ["location"]
            }
          }
        }
      ];

      const result = convertTools(tools);

      expect(result).toBeDefined();
      expect(result!.tools).toHaveLength(1);
      expect(result!.tools[0].toolSpec).toEqual({
        name: "get_weather",
        description: "Get the weather for a location",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              location: { type: "string" }
            },
            required: ["location"]
          }
        }
      });
    });
  });

  describe("buildConverseRequest", () => {
    it("should build a complete request", () => {
      const messages: Message[] = [
        { role: "system", content: "Be helpful." },
        { role: "user", content: "Hello" }
      ];

      const tools: ToolDefinition[] = [
        {
          type: "function",
          function: {
            name: "test_tool",
            description: "A test tool"
          }
        }
      ];

      const result = buildConverseRequest(messages, tools, {
        maxTokens: 1024,
        temperature: 0.7
      });

      expect(result.messages).toHaveLength(1);
      expect(result.system).toEqual([{ text: "Be helpful." }]);
      expect(result.toolConfig).toBeDefined();
      expect(result.inferenceConfig).toEqual({
        maxTokens: 1024,
        temperature: 0.7
      });
    });

    it("should omit inferenceConfig when no options provided", () => {
      const messages: Message[] = [{ role: "user", content: "Hello" }];

      const result = buildConverseRequest(messages);

      expect(result.inferenceConfig).toBeUndefined();
    });
  });
});
