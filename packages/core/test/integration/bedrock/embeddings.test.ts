import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";
import "dotenv/config";

describe("Bedrock Embeddings Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  const modelId = "amazon.titan-embed-text-v2:0";

  it("should generate embeddings for single input", async ({ task }) => {
    polly = setupVCR(task.name, "bedrock");
    const llm = NodeLLM.withProvider("bedrock");

    const response = await llm.embed("Hello world", { model: modelId });

    expect(response.vectors!.length).toBe(1);
    expect(response.vectors![0]!.length).toBe(1024);
    expect(response.model).toBe(modelId);
    expect(response.input_tokens!).toBeGreaterThan(0);
  });

  it("should generate embeddings for multiple inputs", async ({ task }) => {
    polly = setupVCR(task.name, "bedrock");
    const llm = NodeLLM.withProvider("bedrock");

    const response = await llm.embed(["Hello", "World"], { model: modelId });

    expect(response.vectors!.length).toBe(2);
    expect(response.vectors![0]!.length).toBe(1024);
    expect(response.vectors![1]!.length).toBe(1024);
    expect(response.model).toBe(modelId);
    expect(response.input_tokens!).toBeGreaterThan(0);
  });
});
