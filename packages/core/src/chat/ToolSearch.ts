import { Message } from "./Message.js";
import { ToolDefinition } from "./Tool.js";

/**
 * Deferred tools: a chat with many tools can mark some `defer: true`. Their
 * definitions are left out of requests, and the model gets a `tool_search`
 * tool instead. When it searches, the matching tools are "loaded": every
 * request after that sends their definitions. What is loaded is read back
 * from the conversation itself (tool_search results and calls), so it
 * survives serialization and needs no state on the chat.
 */

export const TOOL_SEARCH_NAME = "tool_search";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const SELECT = "select:";
const SUMMARY_LENGTH = 200;

export function hasDeferredTools(tools: ToolDefinition[] | undefined): boolean {
  return !!tools?.some((tool) => tool.defer);
}

/**
 * The tools the chat can run: its own tools plus `tool_search` when any are
 * deferred, so a deferred tool still runs if the model calls it.
 */
export function executableTools(tools: ToolDefinition[] | undefined): ToolDefinition[] | undefined {
  if (!tools || !hasDeferredTools(tools)) return tools;
  return [...tools, searchTool(tools.filter((tool) => tool.defer))];
}

/**
 * The tool definitions to send with a request: tools that are not deferred,
 * `tool_search`, and the deferred tools the conversation has loaded, in the
 * order it first loaded them. Without deferred tools, `tools` as given.
 */
export function requestTools(
  tools: ToolDefinition[] | undefined,
  messages: Message[]
): ToolDefinition[] | undefined {
  if (!tools || !hasDeferredTools(tools)) return tools;

  const deferred = tools.filter((tool) => tool.defer);
  const loaded = loadedToolNames(messages, new Set(deferred.map((tool) => tool.function.name)));
  const byName = new Map(deferred.map((tool) => [tool.function.name, tool]));

  return [
    ...tools.filter((tool) => !tool.defer),
    searchTool(deferred),
    ...loaded.map((name) => byName.get(name)!)
  ].map(withoutDefer);
}

function withoutDefer(tool: ToolDefinition): ToolDefinition {
  if (!("defer" in tool)) return tool;
  const { defer: _defer, ...rest } = tool;
  return rest;
}

function loadedToolNames(messages: Message[], deferred: Set<string>): string[] {
  const results = new Map<string, string>();
  for (const message of messages) {
    if (message.role === "tool" && message.tool_call_id) {
      results.set(message.tool_call_id, String(message.content ?? ""));
    }
  }

  const names: string[] = [];
  for (const message of messages) {
    for (const call of message.tool_calls ?? []) {
      const found =
        call.function.name === TOOL_SEARCH_NAME
          ? parseLoaded(results.get(call.id))
          : [call.function.name];
      for (const name of found) {
        if (deferred.has(name) && !names.includes(name)) names.push(name);
      }
    }
  }
  return names;
}

function parseLoaded(content: string | undefined): string[] {
  if (!content?.startsWith("{")) return [];
  try {
    const loaded = (JSON.parse(content) as { loaded?: unknown }).loaded;
    return Array.isArray(loaded) ? loaded.map(String) : [];
  } catch {
    return [];
  }
}

function searchTool(deferred: ToolDefinition[]): ToolDefinition {
  const names = deferred.map((tool) => tool.function.name);
  return {
    type: "function",
    function: {
      name: TOOL_SEARCH_NAME,
      description:
        "Loads tools you can call in this conversation but whose definitions are not shown yet. " +
        "Search by what you need to do, in a few words, and the tools that match become callable " +
        `from your next step on. Pass ${SELECT}name,other_name to load tools by name. ` +
        `Tools you can load: ${names.join(", ")}.`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: `A few words about the task, or ${SELECT} and tool names, comma-separated`
          },
          limit: {
            type: "integer",
            description: `How many matching tools to load, ${MAX_LIMIT} at most`,
            minimum: 1,
            maximum: MAX_LIMIT
          }
        },
        required: ["query"],
        additionalProperties: false
      }
    },
    handler: async (args: { query?: unknown; limit?: unknown }) =>
      JSON.stringify(search(deferred, String(args?.query ?? ""), Number(args?.limit)))
  };
}

/** Exported for tests. */
export function search(deferred: ToolDefinition[], query: string, limit?: number) {
  const max = Math.min(
    Math.max(Number.isFinite(limit) ? Math.trunc(limit!) : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const found = query.startsWith(SELECT)
    ? requested(query)
        .map((name) => deferred.find((tool) => tool.function.name === name))
        .filter((tool): tool is ToolDefinition => !!tool)
    : rank(deferred, query).slice(0, max);

  if (found.length === 0) {
    return {
      loaded: [],
      error: `No tools match ${query}. Tools you can load: ${deferred.map((t) => t.function.name).join(", ")}`
    };
  }

  const result: Record<string, unknown> = {
    loaded: found.map((tool) => tool.function.name),
    tools: found.map((tool) => ({ name: tool.function.name, description: summary(tool) }))
  };
  if (query.startsWith(SELECT)) {
    const missing = requested(query).filter((name) => !(result.loaded as string[]).includes(name));
    if (missing.length) result.not_loaded = missing;
  }
  return result;
}

function requested(query: string): string[] {
  return [
    ...new Set(
      query
        .slice(SELECT.length)
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    )
  ];
}

function rank(tools: ToolDefinition[], query: string): ToolDefinition[] {
  const terms = words(query);
  return tools
    .map((tool, index) => ({
      tool,
      index,
      score: terms.reduce((sum, t) => sum + score(tool, t), 0)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.tool);
}

function score(tool: ToolDefinition, term: string): number {
  const name = tool.function.name;
  if (words(name).includes(term)) return 4;
  if (name.toLowerCase().includes(term)) return 2;
  const properties = (tool.function.parameters as { properties?: Record<string, unknown> })
    .properties;
  const text = `${tool.function.description ?? ""} ${Object.keys(properties ?? {}).join(" ")}`;
  return words(text).some((word) => word.startsWith(term)) ? 1 : 0;
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function summary(tool: ToolDefinition): string {
  const text = (tool.function.description ?? "").trim();
  return text.length > SUMMARY_LENGTH ? `${text.slice(0, SUMMARY_LENGTH - 3).trimEnd()}...` : text;
}
