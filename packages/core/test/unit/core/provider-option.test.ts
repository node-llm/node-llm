import { describe, it, expect, beforeEach } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { Agent } from "../../../src/agent/Agent.js";
import { providerRegistry } from "../../../src/providers/registry.js";
import { FakeProvider } from "../../fake-provider.js";

describe("provider option", () => {
  let primary: FakeProvider;
  let secondary: FakeProvider;

  beforeEach(() => {
    primary = new FakeProvider(["from primary"]);
    secondary = new FakeProvider(["from secondary"]);
    primary.id = "Primary";
    secondary.id = "Secondary";
    // The factories read the variables, so each test gets fresh providers.
    providerRegistry.register("primary", () => primary);
    providerRegistry.register("secondary", () => secondary);
  });

  it("chat() sends to the provider named in its options", async () => {
    const llm = createLLM({ provider: "primary" });

    const response = await llm.chat("some-model", { provider: "secondary" }).ask("Hi");

    expect(String(response)).toBe("from secondary");
    expect(primary.lastRequest).toBeUndefined();
  });

  it("chat() works from an instance with no provider when the options name one", async () => {
    const llm = createLLM();

    const response = await llm.chat("some-model", { provider: "secondary" }).ask("Hi");

    expect(String(response)).toBe("from secondary");
  });

  it("chat() keeps its own provider when the options name the same one", async () => {
    const llm = createLLM({ provider: "primary" });

    const response = await llm.chat("some-model", { provider: "Primary" }).ask("Hi");

    expect(String(response)).toBe("from primary");
  });

  it("an Agent's static provider decides where it sends", async () => {
    class SecondaryAgent extends Agent {
      static model = "some-model";
      static provider = "secondary";
    }

    const response = await new SecondaryAgent({ llm: createLLM({ provider: "primary" }) }).ask(
      "Hi"
    );

    expect(String(response)).toBe("from secondary");
    expect(primary.lastRequest).toBeUndefined();
  });

  it("an Agent's provider override decides where it sends", async () => {
    class PlainAgent extends Agent {
      static model = "some-model";
    }

    const response = await new PlainAgent({ provider: "secondary", llm: createLLM() }).ask("Hi");

    expect(String(response)).toBe("from secondary");
  });
});
