import type { Message } from "./Message.js";
import type { Provider } from "../providers/Provider.js";
import { TOOL_SEARCH_NAME } from "./ToolSearch.js";
import { logger } from "../utils/logger.js";

/**
 * Shares of the model's context window that tool results may take.
 *
 * - `perResult`: a tool result longer than this share is cut when it is added.
 * - `perRequest`: a request larger than this share leaves out its oldest tool results.
 * - `window`: the context window in tokens, for a model the registry doesn't know.
 *
 * Sizes are estimated from characters, at two a token (how dense JSON and HTML run).
 */
export interface ContextBudget {
  perResult?: number;
  perRequest?: number;
  window?: number;
}

/** Character limits a budget sets for one model. */
export interface BudgetLimits {
  resultChars?: number;
  requestChars?: number;
}

const CHARS_PER_TOKEN = 2;
/** The cut point moves in steps of this share of the request budget, so the prompt cache holds. */
const STEP = 0.15;

export const LEFT_OUT_RESULT =
  "[Earlier tool result left out to fit the context budget. Call the tool again if you need it.]";
export const LEFT_OUT_LATEST_RESULT =
  "[Tool result left out: this round's results were larger than the context budget. Ask for less, such as a narrower query or one page at a time.]";

const warnedModels = new Set<string>();

export function budgetLimits(
  budget: ContextBudget | null | undefined,
  provider: Provider,
  model: string
): BudgetLimits | undefined {
  if (!budget || (budget.perResult === undefined && budget.perRequest === undefined)) {
    return undefined;
  }
  const window = budget.window ?? provider.capabilities?.getContextWindow(model) ?? undefined;
  if (!window) {
    if (!warnedModels.has(model)) {
      warnedModels.add(model);
      logger.warn(
        `No context window known for ${model}; its context budget is off. Pass \`window\` to set one.`
      );
    }
    return undefined;
  }
  const chars = (share: number | undefined) =>
    share === undefined ? undefined : Math.floor(share * window * CHARS_PER_TOKEN);
  return { resultChars: chars(budget.perResult), requestChars: chars(budget.perRequest) };
}

/** Cuts a tool result longer than the per-result budget, ending with a note for the model. */
export function cutToolResult(content: string, limits: BudgetLimits | undefined): string {
  const max = limits?.resultChars;
  if (max === undefined || typeof content !== "string" || content.length <= max) return content;
  const note = `\n\n[Result cut to ${max} of ${content.length} characters to fit the context budget. Ask for a narrower query or the next page to see more.]`;
  return content.slice(0, Math.max(0, max - note.length)) + note;
}

function size(message: Message): number {
  let total = 0;
  const content = message.content as unknown;
  if (typeof content === "string") total += content.length;
  else if (Array.isArray(content)) {
    for (const part of content) {
      if (part && typeof (part as { text?: unknown }).text === "string") {
        total += (part as { text: string }).text.length;
      }
    }
  } else if (content != null) total += String(content).length;
  for (const call of message.tool_calls ?? []) total += call.function.arguments?.length ?? 0;
  return total;
}

/**
 * The messages to send under the per-request budget. When they are larger,
 * the oldest tool results are replaced by a one-line note, in steps of about
 * 15% of the budget so the start of the request stays the same for many
 * rounds. The latest round's results go out whenever they fit; when that
 * round alone is over budget, its oldest results are left out too, so the
 * chat can't get stuck failing every request. `tool_search` results always
 * stay. The chat's own history is not changed.
 */
export function applyRequestBudget(
  messages: Message[],
  limits: BudgetLimits | undefined
): Message[] {
  const max = limits?.requestChars;
  if (max === undefined) return messages;

  const sizes = messages.map(size);
  const total = sizes.reduce((sum, n) => sum + n, 0);
  if (total <= max) return messages;

  const searchCalls = new Set(
    messages.flatMap((m) =>
      (m.tool_calls ?? []).filter((c) => c.function.name === TOOL_SEARCH_NAME).map((c) => c.id)
    )
  );
  let lastAssistant = -1;
  messages.forEach((m, i) => {
    if (m.role === "assistant") lastAssistant = i;
  });
  const results = messages.flatMap((m, i) =>
    m.role === "tool" && !searchCalls.has(m.tool_call_id!) ? [i] : []
  );
  const older = results.filter((i) => i < lastAssistant);
  const latest = results.filter((i) => i > lastAssistant);

  const step = Math.max(1, Math.floor(max * STEP));
  const target = Math.ceil((total - max) / step) * step;

  const leftOut = new Map<number, string>();
  let saved = 0;
  const drop = (i: number, note: string) => {
    if (saved >= target) return;
    leftOut.set(i, note);
    saved += sizes[i]! - note.length;
  };
  for (const i of older) drop(i, LEFT_OUT_RESULT);
  // Only the overflow beyond the budget itself; the latest round goes out whenever it fits.
  if (total - saved > max) {
    for (const i of latest) {
      if (total - saved <= max) break;
      leftOut.set(i, LEFT_OUT_LATEST_RESULT);
      saved += sizes[i]! - LEFT_OUT_LATEST_RESULT.length;
    }
  }

  if (leftOut.size === 0) return messages;
  return messages.map((m, i) => (leftOut.has(i) ? { ...m, content: leftOut.get(i)! } : m));
}
