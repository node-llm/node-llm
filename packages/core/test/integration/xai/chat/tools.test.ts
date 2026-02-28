import { describe, it, expect, afterEach } from "vitest";
import { NodeLLM, Tool, z } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

class CapitalTool extends Tool {
  name = "get_capital";
  description = "Get the capital city of a country";
  schema = z.object({ country: z.string() });

  async execute({ country }: { country: string }) {
    const capitals: Record<string, string> = {
      France: "Paris",
      Germany: "Berlin",
      Japan: "Tokyo"
    };
    return capitals[country] ?? "Unknown";
  }
}

describe("xAI Tools Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should execute a tool call automatically", async ({ task }) => {
    polly = setupVCR(task.name, "xai");

    const llm = NodeLLM.withProvider("xai", {
      xaiApiKey: process.env.XAI_API_KEY
    });
    const chat = llm.chat("grok-3").withTool(CapitalTool);

    const response = await chat.ask("What is the capital of France?");

    expect(String(response)).toContain("Paris");
  });
});
