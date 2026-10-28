import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Agent } from "../../../src/agent/Agent.js";
import { createLLM } from "../../../src/llm.js";
import { Provider } from "../../../src/providers/Provider.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { buildMessageRequest } from "../../../src/providers/anthropic/Utils.js";
import { FakeProvider } from "../../fake-provider.js";

const caching = (provider: FakeProvider) =>
  Object.assign(provider, {
    capabilities: { supportsPromptCaching: () => true }
  }) as unknown as Provider & FakeProvider;

describe("prompt caching", () => {
  it("asks a provider that supports it to cache the request", async () => {
    const provider = caching(new FakeProvider(["Hi"]));

    await new Chat(provider, "fake-model").withPromptCache().ask("Hello");

    expect(provider.lastRequest?.promptCache).toBe(true);
  });

  it("asks when streaming too", async () => {
    const provider = caching(new FakeProvider(["Hi"]));

    for await (const _chunk of new Chat(provider, "fake-model").withPromptCache().stream("Hello")) {
      // drain
    }

    expect(provider.lastRequest?.promptCache).toBe(true);
  });

  it("sends nothing to a provider that doesn't support it", async () => {
    const provider = new FakeProvider(["Hi"]);

    await new Chat(provider, "fake-model").withPromptCache().ask("Hello");

    expect(provider.lastRequest).not.toHaveProperty("promptCache", true);
  });

  it("is off unless asked for", async () => {
    const provider = caching(new FakeProvider(["Hi"]));

    await new Chat(provider, "fake-model").ask("Hello");

    expect(provider.lastRequest?.promptCache).toBeUndefined();
  });

  it("can be turned on for an Agent", async () => {
    const provider = caching(new FakeProvider(["Hi"]));
    providerRegistry.register("prompt-cache-fake", () => provider);
    class CachedAgent extends Agent {
      static model = "fake-model";
      static promptCache = true;
    }

    await new CachedAgent({ llm: createLLM({ provider: "prompt-cache-fake" }) }).ask("Hello");

    expect(provider.lastRequest?.promptCache).toBe(true);
  });

  it("becomes Anthropic's top-level cache_control", () => {
    const messages = [{ role: "user" as const, content: "Hello" }];

    expect(
      buildMessageRequest({ model: "claude-sonnet-4-5", messages, promptCache: true }, false)
    ).toMatchObject({ cache_control: { type: "ephemeral" } });
    expect(buildMessageRequest({ model: "claude-sonnet-4-5", messages }, false)).not.toHaveProperty(
      "cache_control"
    );
  });
});
