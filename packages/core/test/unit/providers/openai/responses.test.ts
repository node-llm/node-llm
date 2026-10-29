import { describe, it, expect, vi, afterEach } from "vitest";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

const readPage = {
  type: "function" as const,
  function: {
    name: "read_page",
    description: "Read a page",
    parameters: { type: "object", properties: { page: { type: "number" } } }
  }
};

// A conversation mid tool loop: the model asked for a page and got it back.
const request = (model: string, withTools = true): ChatRequest => ({
  model,
  messages: [
    { role: "system", content: "You read pages." },
    { role: "user", content: "Read page 1" },
    {
      role: "assistant",
      content: null,
      tool_calls: [
        { id: "call_1", type: "function", function: { name: "read_page", arguments: '{"page":1}' } }
      ]
    },
    { role: "tool", tool_call_id: "call_1", content: "Contents of page 1" }
  ],
  tools: withTools ? [readPage] : undefined
});

const reply = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

const sent = (fetch: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
  return { url, body: JSON.parse(String(init.body)) };
};

describe("OpenAI models that need the Responses API for tools", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends gpt-5.6 with tools to /responses, with the conversation as input items", async () => {
    const fetch = vi.fn().mockResolvedValue(
      reply({
        output: [
          { type: "reasoning", summary: [] },
          {
            type: "function_call",
            call_id: "call_2",
            name: "read_page",
            arguments: '{"page":2}'
          }
        ],
        usage: {
          input_tokens: 120,
          output_tokens: 30,
          total_tokens: 150,
          input_tokens_details: { cached_tokens: 100 },
          output_tokens_details: { reasoning_tokens: 12 }
        }
      })
    );
    vi.stubGlobal("fetch", fetch);

    const response = await new OpenAIProvider({ apiKey: "sk-test" }).chat(request("gpt-5.6-luna"));

    const { url, body } = sent(fetch);
    expect(url).toMatch(/\/responses$/);
    expect(body).toMatchObject({ model: "gpt-5.6-luna", store: false });
    expect(body.input).toEqual([
      { role: "system", content: "You read pages." },
      { role: "user", content: "Read page 1" },
      { type: "function_call", call_id: "call_1", name: "read_page", arguments: '{"page":1}' },
      { type: "function_call_output", call_id: "call_1", output: "Contents of page 1" }
    ]);
    expect(body.tools).toEqual([
      {
        type: "function",
        name: "read_page",
        description: "Read a page",
        parameters: readPage.function.parameters
      }
    ]);
    expect(response.tool_calls).toEqual([
      { id: "call_2", type: "function", function: { name: "read_page", arguments: '{"page":2}' } }
    ]);
    expect(response.usage).toMatchObject({
      input_tokens: 120,
      output_tokens: 30,
      cached_tokens: 100
    });
  });

  it("reads a text answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        reply({
          output: [
            { type: "message", content: [{ type: "output_text", text: "Page 2 says hello" }] }
          ],
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
        })
      )
    );

    const response = await new OpenAIProvider({ apiKey: "sk-test" }).chat(request("gpt-5.6"));

    expect(response.content).toBe("Page 2 says hello");
    expect(response.tool_calls).toBeUndefined();
  });

  it("keeps everything else on Chat Completions", async () => {
    const completion = {
      choices: [{ message: { role: "assistant", content: "Done" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
    };
    for (const [model, withTools] of [
      ["gpt-5.1", true],
      ["gpt-5.6", false]
    ] as const) {
      const fetch = vi.fn().mockResolvedValue(reply(completion));
      vi.stubGlobal("fetch", fetch);

      await new OpenAIProvider({ apiKey: "sk-test" }).chat(request(model, withTools));

      expect(sent(fetch).url).toMatch(/\/chat\/completions$/);
    }
  });
});
