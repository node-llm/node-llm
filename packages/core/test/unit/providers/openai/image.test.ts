import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { OpenAIImage } from "../../../../src/providers/openai/Image.js";
import { BinaryUtils } from "../../../../src/utils/Binary.js";
import { fetchWithTimeout } from "../../../../src/utils/fetch.js";

vi.mock("../../../../src/utils/fetch.js", () => ({
  fetchWithTimeout: vi.fn()
}));

vi.mock("../../../../src/utils/Binary.js", () => ({
  BinaryUtils: {
    toBase64: vi.fn(),
    base64ToBlob: vi.fn(),
    base64ToBuffer: vi.fn()
  }
}));

describe("OpenAIImage", () => {
  const provider = new OpenAIImage("https://api.openai.com/v1", "test-key");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform standard image generation", async () => {
    (fetchWithTimeout as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ url: "https://image.url" }] })
    });

    const response = await provider.execute({
      prompt: "a cat"
    });

    expect(response.url).toBe("https://image.url");
    const [url, options] = (fetchWithTimeout as Mock).mock.calls[0];
    expect(url).toContain("/images/generations");
    expect(JSON.parse(options.body).model).toBe("dall-e-3");
  });

  it("should perform image edits when images are provided", async () => {
    (BinaryUtils.toBase64 as Mock).mockResolvedValue({ data: "base64data", mimeType: "image/png" });
    (BinaryUtils.base64ToBlob as Mock).mockReturnValue(new Blob(["data"], { type: "image/png" }));

    (fetchWithTimeout as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ url: "https://edited.url" }] })
    });

    const response = await provider.execute({
      prompt: "add a hat",
      images: ["source.png"]
    });

    expect(response.url).toBe("https://edited.url");
    const [url, options] = (fetchWithTimeout as Mock).mock.calls[0];
    expect(url).toContain("/images/edits");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("model")).toBe("gpt-image-1");
  });

  it("should perform image variations when no prompt is provided", async () => {
    (BinaryUtils.toBase64 as Mock).mockResolvedValue({ data: "base64data", mimeType: "image/png" });
    (BinaryUtils.base64ToBlob as Mock).mockReturnValue(new Blob(["data"], { type: "image/png" }));

    (fetchWithTimeout as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ url: "https://variation.url" }] })
    });

    const response = await provider.execute({
      prompt: "",
      images: ["source.png"]
    });

    expect(response.url).toBe("https://variation.url");
    const [url] = (fetchWithTimeout as Mock).mock.calls[0];
    expect(url).toContain("/images/variations");
  });

  it("should include mask in edits if provided", async () => {
    (BinaryUtils.toBase64 as Mock).mockResolvedValue({ data: "base64data", mimeType: "image/png" });
    (BinaryUtils.base64ToBlob as Mock).mockReturnValue(new Blob(["data"], { type: "image/png" }));

    (fetchWithTimeout as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [{ url: "https://masked.url" }] })
    });

    await provider.execute({
      prompt: "fill this",
      images: ["source.png"],
      mask: "mask.png"
    });

    const [, options] = (fetchWithTimeout as Mock).mock.calls[0];
    expect(options.body.get("mask")).toBeDefined();
  });
});
