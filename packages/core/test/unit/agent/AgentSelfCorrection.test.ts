import { describe, it, expect, vi } from "vitest";
import {
  Agent,
  defineAgent,
  Tool,
  z,
  createLLM,
  SchemaSelfCorrection
} from "../../../src/index.js";
import { Provider, ChatResponse } from "../../../src/providers/Provider.js";

class MockTool extends Tool {
  name = "get_user";
  description = "Get user details";
  schema = z.object({
    id: z.number().describe("User ID must be a number")
  });

  async execute({ id }: { id: number }) {
    return { id, name: "John Doe" };
  }
}

describe("Agent Self-Correction", () => {
  it("should correct invalid tool arguments in agent mode", async () => {
    let callCount = 0;

    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Model hallucinations: provides ID as a string "123" instead of number 123
          return {
            content: "I'll get the user for you.",
            tool_calls: [
              {
                id: "call_1",
                type: "function",
                function: { name: "get_user", arguments: JSON.stringify({ id: "123" }) }
              }
            ],
            usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
          } as ChatResponse;
        }
        if (callCount === 2) {
          // Model sees the error and corrects it
          return {
            content: "I'll get the user for you.",
            tool_calls: [
              {
                id: "call_2",
                type: "function",
                function: { name: "get_user", arguments: JSON.stringify({ id: 123 }) }
              }
            ],
            usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
          } as ChatResponse;
        }
        // Final response after tool execution
        return {
          content: "The user is John Doe.",
          usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
        } as ChatResponse;
      }),
      defaultModel: () => "mock-model",
      formatToolResultMessage: (id, content) => ({ role: "tool", tool_call_id: id, content })
    };

    const llm = createLLM({ provider: mockProvider as Provider });

    // Define Agent with Self-Correction middleware
    class SupportAgent extends Agent {
      static model = "mock-model";
      static tools = [MockTool];
      static middlewares = [SchemaSelfCorrection({ maxRetries: 2 })];
    }

    const agent = new SupportAgent({ llm });
    const response = await agent.ask("Get user 123");

    // Flow:
    // 1. Ask -> Call 1 (Bad arguments)
    // 2. Middleware catches ZodError -> Logged (Round 1)
    // 3. Tool Result pushed with error: "Expected number, received string"
    // 4. Chat loop continues -> Call 2 (Corrected arguments)
    // 5. Tool executes successfully
    // 6. Final response

    expect(response.toString()).toContain("John Doe");

    // Check that the tool was called with correct arguments eventually
    const toolMessages = agent.history.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(2);

    // First tool result should contain the validation error
    const firstToolResult = toolMessages[0];
    expect(firstToolResult).toBeDefined();
    if (firstToolResult) {
      expect(firstToolResult.content).toContain("Expected number");
    }

    // Total assistant calls should be 3 (Bad call, Corrected call, Final response)
    expect(callCount).toBe(3);
  });

  it("should support structured output correction in agent mode", async () => {
    const OutputSchema = z.object({ code: z.number() });
    let callCount = 0;

    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: JSON.stringify({ code: "not-a-number" }),
            usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
          };
        }
        return {
          content: JSON.stringify({ code: 200 }),
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
        };
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });

    const agent = new (class extends Agent {
      static model = "mock-model";
      static schema = OutputSchema;
      static middlewares = [SchemaSelfCorrection()];
    })({ llm });

    const response = await agent.ask("Status?");
    const parsed = response.parsed as { code: number };
    expect(parsed.code).toBe(200);
    expect(callCount).toBe(2);
  });

  it("should support middlewares in defineAgent", async () => {
    let callCount = 0;
    const mockProvider: Partial<Provider> = {
      id: "mock",
      chat: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: JSON.stringify({ code: "bad" }),
            usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
          };
        }
        return {
          content: JSON.stringify({ code: 1 }),
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
        };
      }),
      defaultModel: () => "mock-model"
    };

    const llm = createLLM({ provider: mockProvider as Provider });

    const SelfCorrectingAgent = defineAgent({
      model: "mock-model",
      schema: z.object({ code: z.number() }),
      middlewares: [SchemaSelfCorrection()]
    });

    const agent = new SelfCorrectingAgent({ llm });
    const response = await agent.ask("Status?");
    const parsed = response.parsed as { code: number };
    expect(parsed.code).toBe(1);
    expect(callCount).toBe(2);
  });
});
