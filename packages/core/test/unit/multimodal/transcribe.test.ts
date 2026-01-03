import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeLLM } from "../../../src/llm.js";
import { Provider } from "../../../src/providers/Provider.js";

describe("Transcription Unit Tests", () => {
  let mockProvider: Provider;

  beforeEach(() => {
    mockProvider = {
      id: "mock-provider",
      chat: vi.fn(),
      transcribe: vi.fn().mockResolvedValue({
        text: "Mock transcription",
        model: "whisper-1",
        duration: 10,
        segments: [{ id: 0, start: 0, end: 10, text: "Mock transcription" }]
      }),
      capabilities: {
        supportsTranscription: vi.fn().mockReturnValue(true),
      } as any
    };
    NodeLLM.configure({ provider: mockProvider });
  });

  it("should call provider.transcribe with correct arguments", async () => {
    await NodeLLM.transcribe("test.mp3", { language: "en", prompt: "Test prompt" });

    expect(mockProvider.transcribe).toHaveBeenCalledWith({
      file: "test.mp3",
      language: "en",
      prompt: "Test prompt",
      model: "",
    });
  });

  it("should support technical domain prompts", async () => {
    const prompt = "Discussion about Ruby, Rails, PostgreSQL, and Redis.";
    await NodeLLM.transcribe("test.mp3", { prompt });

    expect(mockProvider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      prompt: prompt
    }));
  });

  it("should use global default model if provided", async () => {
    NodeLLM.configure({ 
      provider: mockProvider,
      defaultTranscriptionModel: "gpt-4o-transcribe"
    });

    await NodeLLM.transcribe("test.mp3");

    expect(mockProvider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      model: "gpt-4o-transcribe"
    }));
  });

  it("should override global default model with local option", async () => {
    NodeLLM.configure({ 
      provider: mockProvider,
      defaultTranscriptionModel: "gpt-4o-transcribe"
    });

    await NodeLLM.transcribe("test.mp3", { model: "whisper-1" });

    expect(mockProvider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      model: "whisper-1"
    }));
  });

  it("should return a Transcription object with correct properties", async () => {
    const result = await NodeLLM.transcribe("test.mp3");

    expect(result.text).toBe("Mock transcription");
    expect(result.model).toBe("whisper-1");
    expect(result.duration).toBe(10);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].text).toBe("Mock transcription");
    expect(result.toString()).toBe("Mock transcription");
  });

  it("should throw error if provider does not support transcribe", async () => {
    const limitedProvider: Provider = {
      id: "limited-provider",
      chat: vi.fn()
    };
    NodeLLM.configure({ provider: limitedProvider });

    await expect(NodeLLM.transcribe("test.mp3")).rejects.toThrow("Provider does not support transcribe");
  });

  it("should handle segments with speaker labels", async () => {
    mockProvider.transcribe = vi.fn().mockResolvedValue({
      text: "A: Hi\nB: Hello",
      model: "gpt-4o-transcribe-diarize",
      segments: [
        { id: 0, start: 0.5, end: 1.2, text: "Hi", speaker: "A" },
        { id: 1, start: 2.8, end: 3.5, text: "Hello", speaker: "B" }
      ]
    });

    const result = await NodeLLM.transcribe("test.mp3", { model: "gpt-4o-transcribe-diarize" });

    expect(result.segments[0].speaker).toBe("A");
    expect(result.segments[1].speaker).toBe("B");
    expect(result.segments[0].start).toBe(0.5);
  });

  it("should support known speaker identification", async () => {
    await NodeLLM.transcribe("meeting.wav", {
      model: "gpt-4o-transcribe-diarize",
      speakerNames: ["Alice", "Bob"],
      speakerReferences: ["alice.wav", "bob.wav"]
    });

    expect(mockProvider.transcribe).toHaveBeenCalledWith(expect.objectContaining({
      speakerNames: ["Alice", "Bob"],
      speakerReferences: ["alice.wav", "bob.wav"]
    }));
  });

  it("should throw if model does not support transcription", async () => {
    (mockProvider.capabilities!.supportsTranscription as any).mockReturnValue(false);
    await expect(NodeLLM.transcribe("test.mp3", { model: "gpt-4" })).rejects.toThrow("does not support transcription");
  });
});
