import type { Message } from "./Message.js";
import type { ToolCall } from "./Tool.js";

/** What a routeModel function sees before each request of an ask. */
export interface RouteStep {
  /** 0 for an ask's first request, then 1, 2, ... for each request after tool calls */
  turn: number;
  /** The tool calls whose results this request sends, empty on the first request */
  toolCalls: ToolCall[];
  /** The messages so far, the system prompt included */
  messages: Message[];
  /** The chat's own model, used when the function returns nothing */
  model: string;
}

/**
 * Chooses the model for one request of an ask, such as an economical model after routine tool
 * calls and the chat's model for decisions. Returns a model of the chat's provider, or
 * undefined for the chat's own model.
 */
export type RouteModel = (step: RouteStep) => string | undefined | null;

/** The model for a request: the route's choice, or the chat's model when it gives none. */
export function routedModel(route: RouteModel | undefined, step: RouteStep): string {
  if (!route) return step.model;
  const chosen = route(step);
  return typeof chosen === "string" && chosen.trim() !== "" ? chosen : step.model;
}
