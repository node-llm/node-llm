import { describe, it, expect } from "vitest";
import { InsufficientQuotaError, RateLimitError } from "../../../src/errors/index.js";
import { isBillingProblem } from "../../../src/errors/billing.js";
import { handleAnthropicError } from "../../../src/providers/anthropic/Errors.js";
import { handleOpenAIError } from "../../../src/providers/openai/Errors.js";
import { handleGeminiError } from "../../../src/providers/gemini/Errors.js";
import { handleMistralError } from "../../../src/providers/mistral/Errors.js";
import { handleDeepSeekError } from "../../../src/providers/deepseek/Errors.js";
import { handleXAIError } from "../../../src/providers/xai/Errors.js";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// How each provider reports an account that can't pay.
const billing: [string, (response: Response) => Promise<never>, Response][] = [
  [
    "Anthropic (400, credit balance)",
    (r) => handleAnthropicError(r, "claude"),
    json(400, {
      type: "error",
      error: {
        type: "invalid_request_error",
        message: "Your credit balance is too low to access the Anthropic API."
      }
    })
  ],
  [
    "OpenAI (429, insufficient_quota)",
    (r) => handleOpenAIError(r, "gpt"),
    json(429, {
      error: { code: "insufficient_quota", message: "You exceeded your current quota." }
    })
  ],
  [
    "OpenRouter through OpenAI's handler (402)",
    (r) => handleOpenAIError(r, "router"),
    json(402, { error: { message: "Insufficient credits" } })
  ],
  [
    "Gemini (403, billing)",
    (r) => handleGeminiError(r, "gemini"),
    json(403, { error: { message: "Billing account not set up for this project" } })
  ],
  [
    "Mistral (402)",
    (r) => handleMistralError(r, "mistral"),
    json(402, { message: "Payment required" })
  ],
  [
    "DeepSeek (402, insufficient balance)",
    (r) => handleDeepSeekError(r, "deepseek"),
    json(402, { error: { message: "Insufficient Balance" } })
  ],
  [
    "xAI (403, credits)",
    (r) => handleXAIError(r, "grok"),
    json(403, { error: { message: "Your team has run out of credits" } })
  ]
];

describe("Billing errors on every provider", () => {
  it.each(billing)("%s is an InsufficientQuotaError", async (_name, handle, response) => {
    await expect(handle(response)).rejects.toBeInstanceOf(InsufficientQuotaError);
  });

  it("keeps a per-minute quota a rate limit, which is worth retrying", async () => {
    const response = json(429, {
      error: { message: "Quota exceeded for requests per minute. Please retry in 20s." }
    });
    const error = await handleGeminiError(response, "gemini").catch((caught) => caught);

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).not.toBeInstanceOf(InsufficientQuotaError);
  });

  it("recognises billing by status, code or wording", () => {
    expect(isBillingProblem(402, "anything")).toBe(true);
    expect(isBillingProblem(429, "slow down", "insufficient_quota")).toBe(true);
    expect(isBillingProblem(400, "Insufficient funds in your account")).toBe(true);
    expect(isBillingProblem(429, "Rate limit quota exceeded per minute")).toBe(false);
    expect(isBillingProblem(400, "Invalid request")).toBe(false);
  });
});
