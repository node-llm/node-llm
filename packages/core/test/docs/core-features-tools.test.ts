/**
 * Documentation Verification Tests: core-features/tools.md
 *
 * Verifies that all code examples from the Tool Calling documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  Tool,
  z,
  providerRegistry,
  ToolError
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-tools", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Default response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Class-Based Tools", () => {
    it("Tool class can be extended with name, description, schema", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get the current weather for a location";
        schema = z.object({
          location: z.string().describe("The city and state, e.g. San Francisco, CA"),
          unit: z.enum(["celsius", "fahrenheit"]).default("celsius")
        });

        async execute({ location, unit }: { location: string; unit: string }) {
          return { temp: 22, unit, condition: "Sunny" };
        }
      }

      const tool = new WeatherTool();

      expect(tool.name).toBe("get_weather");
      expect(tool.description).toBe("Get the current weather for a location");
      expect(tool.schema).toBeDefined();
    });

    it("Tool generates JSON Schema via toLLMTool()", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get the current weather";
        schema = z.object({
          location: z.string().describe("The city")
        });

        async execute({ location }: { location: string }) {
          return { temp: 22 };
        }
      }

      const tool = new WeatherTool();
      const llmTool = tool.toLLMTool();

      expect(llmTool.type).toBe("function");
      expect(llmTool.function.name).toBe("get_weather");
      expect(llmTool.function.description).toBe("Get the current weather");
      expect(llmTool.function.parameters.type).toBe("object");
      expect(llmTool.function.parameters.properties.location).toBeDefined();
    });

    it("Tool execute() is callable", async () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get weather";
        schema = z.object({ location: z.string() });

        async execute({ location }: { location: string }) {
          return { temp: 22, location };
        }
      }

      const tool = new WeatherTool();
      const result = await tool.execute({ location: "Paris" });

      expect(result).toEqual({ temp: 22, location: "Paris" });
    });
  });

  describe("Defining Parameters with Zod", () => {
    it("supports z.string()", () => {
      const schema = z.object({
        text: z.string()
      });
      expect(schema.parse({ text: "hello" })).toEqual({ text: "hello" });
    });

    it("supports z.number()", () => {
      const schema = z.object({
        count: z.number()
      });
      expect(schema.parse({ count: 42 })).toEqual({ count: 42 });
    });

    it("supports z.boolean()", () => {
      const schema = z.object({
        flag: z.boolean()
      });
      expect(schema.parse({ flag: true })).toEqual({ flag: true });
    });

    it("supports z.enum()", () => {
      const schema = z.object({
        status: z.enum(["active", "inactive"])
      });
      expect(schema.parse({ status: "active" })).toEqual({ status: "active" });
    });

    it("supports z.object() for nested objects", () => {
      const schema = z.object({
        nested: z.object({
          key: z.string()
        })
      });
      expect(schema.parse({ nested: { key: "value" } })).toEqual({ nested: { key: "value" } });
    });

    it("supports z.array()", () => {
      const schema = z.object({
        items: z.array(z.string())
      });
      expect(schema.parse({ items: ["a", "b"] })).toEqual({ items: ["a", "b"] });
    });

    it("supports .describe() for descriptions", () => {
      const schema = z.object({
        location: z.string().describe("The city name")
      });
      expect(schema).toBeDefined();
    });

    it("supports .optional()", () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional()
      });
      expect(schema.parse({ required: "test" })).toEqual({ required: "test" });
    });

    it("supports .default()", () => {
      const schema = z.object({
        unit: z.enum(["celsius", "fahrenheit"]).default("celsius")
      });
      expect(schema.parse({})).toEqual({ unit: "celsius" });
    });
  });

  describe("Using Tools in Chat", () => {
    it("withTool() accepts a Tool class", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get weather";
        schema = z.object({ location: z.string() });
        async execute() {
          return { temp: 22 };
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTool(WeatherTool);

      expect(chat).toBeDefined();
    });

    it("withTools() accepts an array of Tool classes", () => {
      class WeatherTool extends Tool {
        name = "get_weather";
        description = "Get weather";
        schema = z.object({ location: z.string() });
        async execute() {
          return { temp: 22 };
        }
      }

      class CalculatorTool extends Tool {
        name = "calculator";
        description = "Calculate";
        schema = z.object({ expression: z.string() });
        async execute() {
          return "42";
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTools([WeatherTool, CalculatorTool]);

      expect(chat).toBeDefined();
    });

    it("withTools() accepts replace option", () => {
      class SearchTool extends Tool {
        name = "search";
        description = "Search";
        schema = z.object({ query: z.string() });
        async execute() {
          return "results";
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTools([SearchTool], { replace: true });

      expect(chat).toBeDefined();
    });
  });

  describe("Loop Protection (Loop Guard)", () => {
    it("createLLM accepts maxToolCalls option", () => {
      const llm = createLLM({
        provider: "fake",
        maxToolCalls: 10
      });

      expect(llm).toBeDefined();
    });

    it("ask() accepts maxToolCalls option per-request", async () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model");

      const response = await chat.ask("Test", {
        maxToolCalls: 15
      });

      expect(response).toBeDefined();
    });
  });

  describe("Tool Execution Policies (Security)", () => {
    it("withToolExecution() accepts 'auto' mode", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withToolExecution("auto");

      expect(chat).toBeDefined();
    });

    it("withToolExecution() accepts 'confirm' mode", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withToolExecution("confirm");

      expect(chat).toBeDefined();
    });

    it("withToolExecution() accepts 'dry-run' mode", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withToolExecution("dry-run");

      expect(chat).toBeDefined();
    });

    it("onConfirmToolCall() hook exists and is chainable", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm
        .chat("fake-model")
        .withToolExecution("confirm")
        .onConfirmToolCall(async (call) => {
          console.log(`LLM wants to call ${call.function.name}`);
          return true;
        });

      expect(chat).toBeDefined();
    });
  });

  describe("Error Handling & Flow Control (v1.5.1+)", () => {
    it("ToolError class exists and can be instantiated", () => {
      const error = new ToolError("Security Violation", "db_tool", true);

      expect(error).toBeInstanceOf(ToolError);
      expect(error.message).toBe("Security Violation");
    });

    it("ToolError accepts fatal parameter", () => {
      const fatalError = new ToolError("Fatal", "tool", true);
      const nonFatalError = new ToolError("Non-fatal", "tool", false);

      expect(fatalError).toBeDefined();
      expect(nonFatalError).toBeDefined();
    });

    it("onToolCallError hook can return flow control directives", () => {
      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model", {
        onToolCallError: (toolCall, error) => {
          if (toolCall.function.name === "critical_tool") {
            return "STOP";
          }
          return "CONTINUE";
        }
      });

      expect(chat).toBeDefined();
    });
  });

  describe("Advanced: Raw JSON Schema", () => {
    it("Tool supports raw JSON Schema instead of Zod", () => {
      class CustomTool extends Tool {
        name = "custom_lookup";
        description = "Lookup items in a legacy system";

        // Raw JSON Schema instead of Zod
        schema = {
          type: "object" as const,
          properties: {
            sku: { type: "string", description: "Product SKU" },
            limit: { type: "integer", minimum: 1, maximum: 100 }
          },
          required: ["sku"]
        };

        async execute({ sku, limit }: { sku: string; limit?: number }) {
          return { status: "found" };
        }
      }

      const tool = new CustomTool();
      const llmTool = tool.toLLMTool();

      expect(llmTool.function.name).toBe("custom_lookup");
      expect(llmTool.function.parameters.properties.sku).toBeDefined();
    });
  });

  describe("Function-Based Tools (Legacy)", () => {
    it("function-based tool definition is accepted by withTool()", () => {
      const weatherTool = {
        type: "function" as const,
        function: {
          name: "get_weather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City and state" }
            },
            required: ["location"]
          }
        },
        handler: async ({ location }: { location: string }) => {
          return JSON.stringify({ location, temp: 22, unit: "celsius" });
        }
      };

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTool(weatherTool);

      expect(chat).toBeDefined();
    });
  });
});
