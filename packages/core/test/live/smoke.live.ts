/**
 * Smoke tests against real providers: the things a new user tries in their first hour. Each
 * provider runs when its key is set (or LIVE_PROVIDERS names it), on its cheapest model that
 * chats, calls tools and returns structured output, unless LIVE_<PROVIDER>_MODEL says otherwise.
 * A full run costs well under a cent per provider.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Agent, createLLM, defineTool } from "../../src/index.js";
import modelsJson from "../../src/models/models.json" with { type: "json" };

type ModelEntry = {
  id: string;
  provider: string;
  capabilities?: string[];
  created_at?: string;
  pricing?: { text_tokens?: { standard?: { input_per_million?: number } } };
};

const keys: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  xai: "XAI_API_KEY"
};

// Known-good cheap models; for the rest the registry picks.
const defaults: Record<string, string> = { openai: "gpt-5.6-luna", anthropic: "claude-haiku-5-5" };

const models = (
  Array.isArray(modelsJson) ? modelsJson : (modelsJson as { models: ModelEntry[] }).models
) as ModelEntry[];

const cheapestModel = (provider: string) => {
  const needed = ["chat", "function_calling", "structured_output"];
  const lastYear = Date.now() - 365 * 24 * 3600 * 1000;
  return models
    .filter((model) => model.provider === provider)
    .filter((model) => needed.every((capability) => model.capabilities?.includes(capability)))
    .filter((model) => !model.created_at || Date.parse(model.created_at) > lastYear)
    .map((model) => ({
      id: model.id,
      price: model.pricing?.text_tokens?.standard?.input_per_million
    }))
    .filter((model): model is { id: string; price: number } => typeof model.price === "number")
    .sort((a, b) => a.price - b.price)[0]?.id;
};

const chosen = process.env.LIVE_PROVIDERS?.split(",").map((name) => name.trim());
const providers = Object.keys(keys).filter((provider) =>
  chosen ? chosen.includes(provider) : !!process.env[keys[provider]!]
);

const weather = defineTool({
  name: "get_weather",
  description: "Get the current weather in a city",
  schema: z.object({ city: z.string() }),
  execute: async ({ city }) => `It is 21C and sunny in ${city}.`
});

describe.runIf(providers.length > 0).each(providers)("%s", (provider) => {
  const model =
    process.env[`LIVE_${provider.toUpperCase()}_MODEL`] ??
    defaults[provider] ??
    cheapestModel(provider)!;
  const llm = createLLM({
    provider,
    envFallback: false,
    [`${provider}ApiKey`]: process.env[keys[provider]!]
  });

  it(`answers, with usage, cost and latency (${model})`, async () => {
    const answer = await llm.chat(model).ask("Reply with the single word: ready");

    expect(String(answer).toLowerCase()).toContain("ready");
    expect(answer.usage.input_tokens).toBeGreaterThan(0);
    expect(answer.latency).toBeGreaterThan(0);
  });

  it("runs a tool and uses its result", async () => {
    const answer = await llm
      .chat(model)
      .withTool(weather)
      .ask("What is the weather in Kochi? Use the tool.");

    expect(String(answer)).toMatch(/21|sunny/i);
  });

  it("returns structured output from a Zod 4 schema", async () => {
    const answer = await llm
      .chat(model)
      .withSchema(z.object({ city: z.string(), country: z.string() }))
      .ask("Give the city and country of the Eiffel Tower.");

    expect(answer.data).toMatchObject({ city: expect.stringMatching(/paris/i) });
  });

  it("streams", async () => {
    let text = "";
    for await (const chunk of llm.chat(model).stream("Count from 1 to 3, digits only."))
      text += chunk.content;

    expect(text).toMatch(/1[\s\S]*2[\s\S]*3/);
  });

  it("runs an agent class on the provider it names", async () => {
    class WeatherAgent extends Agent {
      static instructions = "Answer weather questions with the tool.";
      static tools = [weather];
    }

    const answer = await new WeatherAgent({ llm, provider, model }).ask("Weather in Oslo?");

    expect(String(answer)).toMatch(/21|sunny/i);
  });

  it("stops a tool loop at maxCost", async () => {
    const chat = llm.chat(model, { maxCost: 0 }).withTool(weather);

    await expect(chat.ask("What is the weather in Kochi? Use the tool.")).rejects.toThrow(
      /cost limit/i
    );
  });
});
