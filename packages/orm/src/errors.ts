import { LLMError } from "@node-llm/core";

/**
 * The store stopped a chat or agent session, before its next request, by answering
 * `createRequest` with `{ stop }`: for example, when the account has reached a spending limit
 * kept outside the app. Every tool call that ran has its result in the history.
 */
export class StoppedByStoreError extends LLMError {
  constructor(
    /** What the store gave as the reason */
    public readonly reason: string
  ) {
    super(reason, "STOPPED_BY_STORE");
  }
}
