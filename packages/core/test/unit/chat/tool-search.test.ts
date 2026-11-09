import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Chat } from "../../../src/chat/Chat.js";
import { defineTool, ToolDefinition } from "../../../src/chat/Tool.js";
import { search, TOOL_SEARCH_NAME } from "../../../src/chat/ToolSearch.js";
import { FakeProvider } from "../../fake-provider.js";

const Weather = defineTool({
  name: "get_weather",
  description: "Get the current weather for a city",
  schema: z.object({ city: z.string() }),
  execute: async ({ city }) => `Sunny in ${city}`
});
const Refund = defineTool({
  name: "issue_refund",
  description: "Refund an order to the customer's card",
  schema: z.object({ orderId: z.string() }),
  defer: true,
  execute: async ({ orderId }) => `Refunded ${orderId}`
});
const Invoice = defineTool({
  name: "send_invoice",
  description: "Email an invoice for an order",
  schema: z.object({ orderId: z.string() }),
  defer: true,
  execute: async () => "sent"
});

const call = (id: string, name: string, args: object) => ({
  content: null,
  tool_calls: [
    { id, type: "function" as const, function: { name, arguments: JSON.stringify(args) } }
  ]
});

const names = (tools?: ToolDefinition[]) => (tools ?? []).map((t) => t.function.name);

describe("deferred tools", () => {
  it("sends tool_search instead of deferred tools, then the tools it loads", async () => {
    const provider = new FakeProvider([
      call("c1", TOOL_SEARCH_NAME, { query: "refund order" }),
      call("c2", "issue_refund", { orderId: "A1" }),
      "Done"
    ]);
    const requests: string[][] = [];
    const chat = new Chat(provider, "m").withTools([Weather, Refund, Invoice]);
    const original = provider.chat.bind(provider);
    provider.chat = async (request) => {
      requests.push(names(request.tools));
      expect(request.tools?.some((t) => "defer" in t)).toBe(false);
      return original(request);
    };

    const reply = await chat.ask("Refund order A1");

    expect(reply.content).toBe("Done");
    expect(requests[0]).toEqual(["get_weather", TOOL_SEARCH_NAME]);
    expect(requests[1]).toEqual(["get_weather", TOOL_SEARCH_NAME, "issue_refund", "send_invoice"]);
    const toolResults = chat.history.filter((m) => m.role === "tool").map((m) => m.content);
    expect(toolResults[1]).toBe("Refunded A1");
  });

  it("leaves requests unchanged when no tool is deferred", async () => {
    const provider = new FakeProvider(["hi"]);
    await new Chat(provider, "m").withTools([Weather]).ask("hello");
    expect(names(provider.lastRequest?.tools)).toEqual(["get_weather"]);
  });

  it("still runs a deferred tool the model calls directly", async () => {
    const provider = new FakeProvider([call("c1", "send_invoice", { orderId: "B2" }), "ok"]);
    const chat = new Chat(provider, "m").withTools([Weather, Invoice]);
    await chat.ask("Invoice B2");
    expect(chat.history.find((m) => m.role === "tool")?.content).toBe("sent");
    expect(names(provider.lastRequest?.tools)).toContain("send_invoice");
  });
});

describe("search", () => {
  const deferred = [new Refund().toLLMTool(), new Invoice().toLLMTool()];

  it("ranks by name, then description", () => {
    expect(search(deferred, "invoice").loaded).toEqual(["send_invoice"]);
    expect(search(deferred, "order", 1).loaded).toHaveLength(1);
  });

  it("loads tools by name with select:", () => {
    expect(search(deferred, "select:issue_refund, nope")).toMatchObject({
      loaded: ["issue_refund"],
      not_loaded: ["nope"]
    });
  });

  it("lists loadable tools when nothing matches", () => {
    expect(search(deferred, "weather")).toMatchObject({ loaded: [] });
    expect(String(search(deferred, "weather").error)).toContain("issue_refund, send_invoice");
  });
});
