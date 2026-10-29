// Phrases providers use when an account is out of credit or its billing isn't set up. A plain
// "quota" isn't one of them: providers also use it for per-minute rate limits, which pass on their
// own and are worth retrying.
const BILLING_PHRASES = [
  "credit balance",
  "insufficient balance",
  "insufficient credit",
  "insufficient funds",
  "out of credits",
  "exceeded your current quota",
  "billing",
  "payment required"
];

/**
 * Whether a provider's error means the account can't pay for the request, whatever status it
 * arrived with: providers report this as 402, 400, 403 or 429. Every provider's error handler
 * asks this first, so the same problem is an InsufficientQuotaError everywhere.
 */
export function isBillingProblem(status: number, message: string, code?: string): boolean {
  if (status === 402 || code === "insufficient_quota") return true;

  const text = message.toLowerCase();
  return BILLING_PHRASES.some((phrase) => text.includes(phrase));
}
