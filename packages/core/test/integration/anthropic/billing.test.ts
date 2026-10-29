import { describe, it, expect, afterEach } from "vitest";
import { createLLM, InsufficientQuotaError } from "../../../src/index.js";
import { setupVCR } from "../../helpers/vcr.js";

describe("Anthropic billing errors", () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    await polly?.stop();
  });

  // Recorded from an account with no credit left: Anthropic answers 400, not 429.
  it("reports an account out of credit as InsufficientQuotaError, without retrying", async ({
    task
  }) => {
    polly = setupVCR(task.name, "anthropic", { recordFailedRequests: true });
    const llm = createLLM({ provider: "anthropic", maxRetries: 2 });

    await expect(llm.chat("claude-haiku-5-5").ask("Hello")).rejects.toBeInstanceOf(
      InsufficientQuotaError
    );
  });
});
