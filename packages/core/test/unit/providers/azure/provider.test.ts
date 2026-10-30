import { describe, it, expect, vi, afterEach } from "vitest";
import { AzureOpenAIProvider } from "../../../../src/providers/azure/AzureOpenAIProvider.js";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";
import { createLLM } from "../../../../src/llm.js";

const deployment =
  "https://my-resource.openai.azure.com/openai/deployments/team-gpt-6-luna?api-version=2025-04-01-preview";

const readPage = {
  type: "function" as const,
  function: {
    name: "read_page",
    description: "Read a page",
    parameters: { type: "object", properties: { page: { type: "number" } } }
  }
};

const request = (model: string, withTools: boolean): ChatRequest => ({
  model,
  messages: [{ role: "user", content: "Read page 1" }],
  tools: withTools ? [readPage] : undefined
});

const reply = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });

const completion = {
  choices: [{ message: { role: "assistant", content: "Done" } }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
};

const responsesAnswer = {
  output: [{ type: "function_call", call_id: "call_1", name: "read_page", arguments: "{}" }],
  usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
};

const sent = (fetch: ReturnType<typeof vi.fn>) => {
  const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
  return {
    url,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(String(init.body))
  };
};

const stubFetch = (body: unknown) => {
  const fetch = vi.fn().mockResolvedValue(reply(body));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

describe("Azure OpenAI", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("chats with the deployment, signed with the resource's key", async () => {
    const fetch = stubFetch(completion);

    await new AzureOpenAIProvider({ apiKey: "azure-key", baseUrl: deployment }).chat(
      request("gpt-4.1", true)
    );

    const { url, headers } = sent(fetch);
    expect(url).toBe(
      "https://my-resource.openai.azure.com/openai/deployments/team-gpt-6-luna/chat/completions?api-version=2025-04-01-preview"
    );
    expect(headers["api-key"]).toBe("azure-key");
    expect(headers.Authorization).toBeUndefined();
  });

  it("sends tools for models that need the Responses API to the resource's v1 address, naming the deployment", async () => {
    const fetch = stubFetch(responsesAnswer);

    const response = await new AzureOpenAIProvider({
      apiKey: "azure-key",
      baseUrl: deployment
    }).chat(request("gpt-6-luna", true));

    const { url, headers, body } = sent(fetch);
    expect(url).toBe("https://my-resource.openai.azure.com/openai/v1/responses");
    expect(headers["api-key"]).toBe("azure-key");
    expect(body.model).toBe("team-gpt-6-luna");
    expect(response.tool_calls?.[0]?.function.name).toBe("read_page");
  });

  it("keeps the model as given with the resource's v1 address", async () => {
    const fetch = stubFetch(responsesAnswer);

    await new AzureOpenAIProvider({
      apiKey: "azure-key",
      baseUrl: "https://my-resource.openai.azure.com/openai/v1"
    }).chat(request("gpt-6-luna", true));

    const { url, body } = sent(fetch);
    expect(url).toBe("https://my-resource.openai.azure.com/openai/v1/responses");
    expect(body.model).toBe("gpt-6-luna");
  });

  it("streams from the deployment with the resource's key", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "Content-Type": "text/event-stream" }
      })
    );
    vi.stubGlobal("fetch", fetch);

    const provider = new AzureOpenAIProvider({ apiKey: "azure-key", baseUrl: deployment });
    for await (const _chunk of provider.stream(request("gpt-4.1", false))) {
      // drain
    }

    const { headers } = sent(fetch);
    expect(headers["api-key"]).toBe("azure-key");
    expect(headers.Authorization).toBeUndefined();
  });

  it("is chosen with provider azure, and says what is missing", () => {
    expect(() =>
      createLLM({ provider: "azure", azureApiKey: "azure-key", azureApiBase: deployment })
    ).not.toThrow();
    expect(() =>
      createLLM({ provider: "azure", azureApiKey: "azure-key", envFallback: false })
    ).toThrow(/azureApiBase/);
  });

  it("leaves OpenAI's own requests signed with a bearer token", async () => {
    const fetch = stubFetch(completion);

    await new OpenAIProvider({ apiKey: "sk-test" }).chat(request("gpt-4.1", false));

    const { headers } = sent(fetch);
    expect(headers.Authorization).toBe("Bearer sk-test");
    expect(headers["api-key"]).toBeUndefined();
  });
});
