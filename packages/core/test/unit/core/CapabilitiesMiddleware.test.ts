import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeLLM, createLLM } from "../../../src/llm.js";
import { FakeProvider } from "../../fake-provider.js";
import { Middleware, MiddlewareContext } from "../../../src/types/Middleware.js";
import { Transcription } from "../../../src/transcription/Transcription.js";
import { Moderation } from "../../../src/moderation/Moderation.js";
import { GeneratedImage } from "../../../src/image/GeneratedImage.js";

class TestProvider extends FakeProvider {
  public calls = {
    transcribe: [] as any[],
    moderate: [] as any[],
    paint: [] as any[]
  };

  constructor() {
    super([]);
  }

  async transcribe(request: any) {
    this.calls.transcribe!.push(request);
    return {
      text: "transcribed text",
      model: "test-model",
      segments: []
    };
  }

  async moderate(request: any) {
    this.calls.moderate!.push(request);
    return {
      id: "mod-123",
      model: "test-model",
      results: [
        {
          flagged: false,
          categories: { sexual: false, hate: false, violence: false, "self-harm": false },
          category_scores: { sexual: 0, hate: 0, violence: 0, "self-harm": 0 }
        }
      ]
    };
  }

  async paint(request: any) {
    this.calls.paint!.push(request);
    return {
      url: "http://example.com/image.png"
    };
  }
}

describe("Capabilities Middleware", () => {
  let provider: TestProvider;
  let llm: any; // Using any for NodeLLMCore instance

  beforeEach(() => {
    provider = new TestProvider();
    llm = createLLM({ provider });
  });

  describe("Transcription Middleware", () => {
    it("should execute hooks for transcription", async () => {
      const onRequest = vi.fn();
      const onResponse = vi.fn();
      const middleware: Middleware = {
        name: "TranscribeMiddleware",
        onRequest,
        onResponse
      };

      await llm.transcribe("audio.mp3", { middlewares: [middleware] });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const reqCtx = onRequest.mock.calls[0]![0] as MiddlewareContext;
      expect(reqCtx.input).toBe("audio.mp3");
      // Use type assertion or check existence
      expect(reqCtx.transcriptionOptions).toBeDefined();

      expect(onResponse).toHaveBeenCalledTimes(1);
      const resCtx = onResponse.mock.calls[0]![0];
      const result = onResponse.mock.calls[0]![1];
      expect(result).toBeInstanceOf(Transcription);
      expect(result.text).toBe("transcribed text");
    });

    it("should allow modifying input file in onRequest", async () => {
      const modifier: Middleware = {
        name: "Modifier",
        onRequest: async (ctx) => {
          ctx.input = "modified.mp3";
        }
      };

      await llm.transcribe("original.mp3", { middlewares: [modifier] });

      expect(provider.calls.transcribe).toHaveLength(1);
      expect(provider.calls.transcribe![0].file).toBe("modified.mp3");
    });
  });

  describe("Moderation Middleware", () => {
    it("should execute hooks for moderation", async () => {
      const onRequest = vi.fn();
      const onResponse = vi.fn();

      await llm.moderate("nasty text", {
        middlewares: [{ name: "Mod", onRequest, onResponse }]
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      expect((onRequest.mock.calls[0]![0] as MiddlewareContext).input).toBe("nasty text");

      expect(onResponse).toHaveBeenCalledTimes(1);
      const result = onResponse.mock.calls[0]![1];
      expect(result).toBeInstanceOf(Moderation);
      expect(result.flagged).toBe(false);
    });

    it("should handle array input modifications", async () => {
      const modifier: Middleware = {
        name: "ArrayMod",
        onRequest: async (ctx) => {
          ctx.input = ["clean text"];
        }
      };

      await llm.moderate(["dirty text"], { middlewares: [modifier] });

      expect(provider.calls.moderate).toHaveLength(1);
      expect(provider.calls.moderate![0].input).toEqual(["clean text"]);
    });
  });

  describe("Paint (Image Generation) Middleware", () => {
    it("should execute hooks for image generation", async () => {
      const onRequest = vi.fn();
      const onResponse = vi.fn();

      await llm.paint("a sunset", {
        middlewares: [{ name: "PaintMod", onRequest, onResponse }]
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      expect((onRequest.mock.calls[0]![0] as MiddlewareContext).input).toBe("a sunset");
      expect((onRequest.mock.calls[0]![0] as MiddlewareContext).imageOptions).toBeDefined();

      expect(onResponse).toHaveBeenCalledTimes(1);
      const result = onResponse.mock.calls[0]![1];
      expect(result).toBeInstanceOf(GeneratedImage);
      expect(result.url).toBe("http://example.com/image.png");
    });

    it("should allow modifying prompt in onRequest", async () => {
      const modifier: Middleware = {
        name: "PromptMod",
        onRequest: async (ctx) => {
          ctx.input = "a sunrise";
        }
      };

      await llm.paint("a sunset", { middlewares: [modifier] });

      expect(provider.calls.paint).toHaveLength(1);
      expect(provider.calls.paint![0].prompt).toBe("a sunrise");
    });
  });

  describe("Error Handling", () => {
    it("should catch errors in transcription", async () => {
      vi.spyOn(provider, "transcribe").mockRejectedValue(new Error("Fail"));
      const onError = vi.fn();

      await expect(
        llm.transcribe("file.mp3", {
          middlewares: [{ name: "Err", onError }]
        })
      ).rejects.toThrow("Fail");

      expect(onError).toHaveBeenCalledTimes(1);
      const [ctx, error] = onError.mock.calls[0]!;
      expect((error as Error).message).toBe("Fail");
      expect(ctx.requestId).toBeDefined();
    });

    it("should catch errors in moderation", async () => {
      vi.spyOn(provider, "moderate").mockRejectedValue(new Error("Moderation failed"));
      const onError = vi.fn();

      await expect(
        llm.moderate("bad text", {
          middlewares: [{ name: "Err", onError }]
        })
      ).rejects.toThrow("Moderation failed");

      expect(onError).toHaveBeenCalledTimes(1);
      const [ctx, error] = onError.mock.calls[0]!;
      expect((error as Error).message).toBe("Moderation failed");
      expect(ctx.requestId).toBeDefined();
    });

    it("should catch errors in paint", async () => {
      vi.spyOn(provider, "paint").mockRejectedValue(new Error("Paint failed"));
      const onError = vi.fn();

      await expect(
        llm.paint("a picture", {
          middlewares: [{ name: "Err", onError }]
        })
      ).rejects.toThrow("Paint failed");

      expect(onError).toHaveBeenCalledTimes(1);
      const [ctx, error] = onError.mock.calls[0]!;
      expect((error as Error).message).toBe("Paint failed");
      expect(ctx.requestId).toBeDefined();
    });
  });
});
