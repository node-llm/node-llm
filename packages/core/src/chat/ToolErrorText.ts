import { redactSecrets } from "../utils/redact.js";

const MAX_ERROR_TEXT = 500;

/**
 * What the model is told about a tool's error: its message, with key-like values masked and cut
 * to 500 characters, so a database error or a stack in a message doesn't send credentials or
 * pages of internals to the model (and from there to the user).
 */
export function toolErrorText(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const masked = redactSecrets(message);
  return masked.length > MAX_ERROR_TEXT ? `${masked.slice(0, MAX_ERROR_TEXT)}...` : masked;
}
