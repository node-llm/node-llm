import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { ServerError } from "../../../src/errors/index.js";
import { requestForFallback } from "../../../src/executor/Fallback.js";
import { ChatRequest, ProviderCapabilities } from "../../../src/providers/Provider.js";

const serverDown = () => new ServerError("down", 503, {});

function strictBackup(replies: string[]) {
  const provider = new FakeProvider(replies);
  provider.id = "backup";
  (provider as { capabilities?: Partial<ProviderCapabilities> }).capabilities = {
    supportsTemperature: () => false,
    supportsReasoning: () => false,
    supportsPromptCaching: () => false,
    supportsToolChoice: () => false,
    supportsPrediction: () => false
  };
  return provider;
}

describe("requests sent to a fallback model", () => {
  it("leave out settings the fallback model does not take", () => {
    const request: ChatRequest = {
      model: "main",
      messages: [],
      temperature: 0.2,
      thinking: { effort: "high" },
      promptCache: true,
      tool_choice: "required",
      prediction: "draft",
      max_tokens: 100
    };
    const adapted = requestForFallback(strictBackup([]), request, "small");

    expect(adapted).toEqual({ model: "small", messages: [], max_tokens: 100 });
    expect(request.temperature).toBe(0.2); // the original is untouched
  });

  it("keeps settings when the fallback model takes them", () => {
    const provider = new FakeProvider([]);
    (provider as { capabilities?: Partial<ProviderCapabilities> }).capabilities = {
      supportsTemperature: () => true,
      supportsReasoning: () => true,
      supportsPromptCaching: () => true
    };
    const adapted = requestForFallback(
      provider,
      {
        model: "main",
        messages: [],
        temperature: 0.2,
        thinking: { effort: "low" },
        promptCache: true
      },
      "small"
    );
    expect(adapted).toMatchObject({
      temperature: 0.2,
      thinking: { effort: "low" },
      promptCache: true
    });
  });

  it("are adapted for ask() and stream()", async () => {
    for (const mode of ["ask", "stream"] as const) {
      const backup = strictBackup(["from backup"]);
      const chat = new Chat(new FakeProvider([serverDown()]), "main", {
        temperature: 0.3,
        resolveProvider: () => backup
      }).withFallbacks({ model: "backup-model", provider: "backup" });

      if (mode === "ask") await chat.ask("hi");
      else for await (const _chunk of chat.stream("hi")) void _chunk;

      expect(backup.lastRequest?.model, mode).toBe("backup-model");
      expect(backup.lastRequest?.temperature, mode).toBeUndefined();
    }
  });
});
