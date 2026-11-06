import { describe, it, expect, vi, afterEach } from "vitest";
import { AzureProvider } from "../../../../src/providers/azure/AzureProvider.js";
import { OpenAIProvider } from "../../../../src/providers/openai/OpenAIProvider.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";
import { createLLM } from "../../../../src/llm.js";
import { UnsupportedFeatureError } from "../../../../src/errors/index.js";

const deployment =
  "https://my-resource.openai.azure.com/openai/deployments/team-gpt-6?api-version=2025-04-01-preview";
const resource = "https://my-resource.services.ai.azure.com";

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
  usage: { prompt_tokens: 1_000_000, completion_tokens: 0, total_tokens: 1_000_000 }
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
    body: init.body ? JSON.parse(String(init.body)) : undefined
  };
};

const stubFetch = (body: unknown) => {
  const fetch = vi.fn().mockResolvedValue(reply(body));
  vi.stubGlobal("fetch", fetch);
  return fetch;
};

const azure = (baseUrl: string, options: { deployments?: Record<string, string> } = {}) =>
  new AzureProvider({ apiKey: "azure-key", baseUrl, ...options });

describe("Azure AI Foundry", () => {
  afterEach(() => vi.unstubAllGlobals());

  describe("where chat requests go", () => {
    it.each([
      [
        "a deployment's address",
        deployment,
        "https://my-resource.openai.azure.com/openai/deployments/team-gpt-6/chat/completions?api-version=2025-04-01-preview"
      ],
      [
        "a deployment's address without a version",
        "https://my-resource.openai.azure.com/openai/deployments/gpt-4o/",
        "https://my-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-05-01-preview"
      ],
      [
        "a model endpoint, as given",
        `${resource}/models/chat/completions?api-version=2024-05-01-preview`,
        `${resource}/models/chat/completions?api-version=2024-05-01-preview`
      ],
      [
        "the resource's v1 address",
        `${resource}/openai/v1`,
        `${resource}/openai/v1/chat/completions`
      ],
      [
        "the resource itself, through Foundry's model inference",
        resource,
        `${resource}/models/chat/completions?api-version=2024-05-01-preview`
      ]
    ])("goes to %s", async (_shape, baseUrl, expected) => {
      const fetch = stubFetch(completion);

      await azure(baseUrl).chat(request("DeepSeek-V3.2", false));

      const { url, headers, body } = sent(fetch);
      expect(url).toBe(expected);
      expect(headers["api-key"]).toBe("azure-key");
      expect(headers.Authorization).toBeUndefined();
      expect(body.model).toBe("DeepSeek-V3.2");
    });
  });

  describe("signing", () => {
    it("sends the key as a bearer token to a serverless endpoint", async () => {
      const fetch = stubFetch(completion);

      await azure("https://Llama-3-3-70B.eastus2.models.ai.azure.com/chat/completions").chat(
        request("Llama-3.3-70B-Instruct", false)
      );

      const { url, headers } = sent(fetch);
      expect(url).toBe("https://Llama-3-3-70B.eastus2.models.ai.azure.com/chat/completions");
      expect(headers.Authorization).toBe("Bearer azure-key");
      expect(headers["api-key"]).toBeUndefined();
    });

    it("signs with a Microsoft Entra ID token when there is no key", async () => {
      const fetch = stubFetch(completion);

      await new AzureProvider({ authToken: "entra-token", baseUrl: resource }).chat(
        request("gpt-4o", false)
      );

      const { headers } = sent(fetch);
      expect(headers.Authorization).toBe("Bearer entra-token");
      expect(headers["api-key"]).toBeUndefined();
    });

    it("leaves OpenAI's own requests signed with a bearer token", async () => {
      const fetch = stubFetch(completion);

      await new OpenAIProvider({ apiKey: "sk-test" }).chat(request("gpt-4.1", false));

      const { headers } = sent(fetch);
      expect(headers.Authorization).toBe("Bearer sk-test");
      expect(headers["api-key"]).toBeUndefined();
    });
  });

  describe("the Responses API", () => {
    it("takes tool calls for models that need it, at the v1 address, naming the deployment", async () => {
      const fetch = stubFetch(responsesAnswer);

      const response = await azure(deployment).chat(request("gpt-6", true));

      const { url, headers, body } = sent(fetch);
      expect(url).toBe("https://my-resource.openai.azure.com/openai/v1/responses");
      expect(headers["api-key"]).toBe("azure-key");
      expect(body.model).toBe("team-gpt-6");
      expect(response.tool_calls?.[0]?.function.name).toBe("read_page");
    });

    it("knows a deployment by the model it runs", async () => {
      const fetch = stubFetch(responsesAnswer);

      await azure(`${resource}/openai/v1`, { deployments: { "team-gpt6": "gpt-6" } }).chat(
        request("team-gpt6", true)
      );

      const { url, body } = sent(fetch);
      expect(url).toBe(`${resource}/openai/v1/responses`);
      expect(body.model).toBe("team-gpt6");
    });

    it("leaves other models' tool calls on Chat Completions", async () => {
      const fetch = stubFetch(completion);

      await azure(resource).chat(request("Llama-3.3-70B-Instruct", true));

      expect(sent(fetch).url).toBe(
        `${resource}/models/chat/completions?api-version=2024-05-01-preview`
      );
    });
  });

  it("prices a deployment as the model it runs", async () => {
    stubFetch(completion);

    const response = await azure(resource, {
      deployments: { "team-llama": "llama-3.3-70b-instruct" }
    }).chat(request("team-llama", false));

    expect(response.usage?.cost).toBeCloseTo(0.71);
  });

  it("streams from the deployment with the resource's key", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "Content-Type": "text/event-stream" }
      })
    );
    vi.stubGlobal("fetch", fetch);

    for await (const _chunk of azure(deployment).stream(request("gpt-4.1", false))) {
      // drain
    }

    const { url, headers } = sent(fetch);
    expect(url).toBe(
      "https://my-resource.openai.azure.com/openai/deployments/team-gpt-6/chat/completions?api-version=2025-04-01-preview"
    );
    expect(headers["api-key"]).toBe("azure-key");
  });

  describe("embeddings", () => {
    const embedded = {
      data: [{ embedding: [0.1, 0.2] }],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 2 }
    };

    it("go to an embedding deployment's address", async () => {
      const fetch = stubFetch(embedded);

      await azure(
        "https://my-resource.openai.azure.com/openai/deployments/embed?api-version=2024-10-21"
      ).embed({ input: "hello", model: "embed" });

      expect(sent(fetch).url).toBe(
        "https://my-resource.openai.azure.com/openai/deployments/embed/embeddings?api-version=2024-10-21"
      );
    });

    it("go to the resource's v1 address otherwise, whatever the deployment is called", async () => {
      const fetch = stubFetch(embedded);

      const response = await azure(resource).embed({ input: "hello", model: "team-embedder" });

      const { url, headers } = sent(fetch);
      expect(url).toBe(`${resource}/openai/v1/embeddings`);
      expect(headers["api-key"]).toBe("azure-key");
      expect(response.vectors).toEqual([[0.1, 0.2]]);
    });
  });

  it("lists each model the resource offers once, leaving out retired ones", async () => {
    const fetch = stubFetch({
      data: [
        { id: "gpt-4o", created: 1 },
        { id: "gpt-4o", created: 1 },
        { id: "DeepSeek-V3.2", created: 2 },
        { id: "gpt-35-turbo-0301", created: 3, deprecation: { inference: 1 } }
      ]
    });

    const models = await azure(deployment).listModels();

    expect(sent(fetch).url).toBe(
      "https://my-resource.openai.azure.com/openai/v1/models?api-version=preview"
    );
    expect(models.map((model) => model.id)).toEqual(["gpt-4o", "DeepSeek-V3.2"]);
    expect(models[0]?.provider).toBe("azure");
  });

  describe("capabilities", () => {
    const provider = azure(resource, { deployments: { "team-llama": "llama-3.3-70b-instruct" } });

    it("come from the registry for the model a deployment runs", () => {
      expect(provider.capabilities.supportsTools("team-llama")).toBe(true);
      expect(provider.capabilities.supportsVision("team-llama")).toBe(false);
      expect(provider.capabilities.supportsEmbeddings("team-llama")).toBe(false);
      expect(provider.capabilities.supportsVision("gpt-4o")).toBe(true);
      expect(provider.capabilities.getContextWindow("team-llama")).toBe(128000);
      expect(provider.registryModel("mte-dev-uae-gpt-4o-mini-128k-global-standard")).toBe(
        "gpt-4o-mini"
      );
      expect(provider.registryModel("mte-sweden-gpt-5.4-272k-global-standard")).toBe("gpt-5.4");
    });

    it("let a deployment the registry doesn't know do what Azure allows", () => {
      expect(provider.capabilities.supportsTools("our-own-deployment")).toBe(true);
      expect(provider.capabilities.supportsStructuredOutput("our-own-deployment")).toBe(true);
    });

    it("leave out what this provider doesn't support yet", async () => {
      expect(provider.capabilities.supportsImageGeneration("gpt-image-1")).toBe(false);
      await expect(provider.paint({ prompt: "A cat", model: "gpt-image-1" })).rejects.toThrow(
        UnsupportedFeatureError
      );
    });
  });

  it("is chosen with provider azure, and says what is missing", () => {
    expect(() =>
      createLLM({ provider: "azure", azureApiKey: "azure-key", azureApiBase: deployment })
    ).not.toThrow();
    expect(() =>
      createLLM({ provider: "azure", azureAuthToken: "entra-token", azureApiBase: resource })
    ).not.toThrow();
    expect(() =>
      createLLM({ provider: "azure", azureApiKey: "azure-key", envFallback: false })
    ).toThrow(/azureApiBase/);
    expect(() =>
      createLLM({ provider: "azure", azureApiBase: resource, envFallback: false })
    ).toThrow(/azureApiKey or azureAuthToken/);
  });
});
