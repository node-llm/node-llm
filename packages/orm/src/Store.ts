/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Where an ORM chat or agent session keeps its records. The Prisma store is the default; an app
 * can pass its own to keep the same records anywhere else, such as behind its own HTTP API.
 */

export interface StoredChat {
  id: string;
  model?: string | null;
  provider?: string | null;
  instructions?: string | null;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredMessage {
  id: string;
  chatId: string;
  role: string;
  content: string | null;
  contentRaw?: string | null;
  reasoning?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  thinkingText?: string | null;
  thinkingSignature?: string | null;
  thinkingTokens?: number | null;
  modelId?: string | null;
  provider?: string | null;
  createdAt: Date;
}

export interface StoredAgentSession {
  id: string;
  agentClass: string;
  chatId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewChat {
  model?: string | null;
  provider?: string | null;
  instructions?: string | null;
  metadata?: any;
  /** Extra columns an app adds to its chat table, such as a user id */
  [column: string]: unknown;
}

export type MessageUpdate = Partial<Omit<StoredMessage, "id" | "chatId" | "role" | "createdAt">>;

export interface NewToolCall {
  messageId: string;
  toolCallId: string;
  name: string;
  arguments: string;
  thought?: string | null;
  thoughtSignature?: string | null;
}

export interface NewRequest {
  chatId: string;
  messageId: string | null;
  provider: string;
  model: string;
  statusCode: number;
  /** Milliseconds */
  duration: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface RequestTotals {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ChatStore {
  createChat(chat: NewChat): Promise<StoredChat>;
  findChat(id: string): Promise<StoredChat | null>;
  /** Removes the chat with everything recorded under it */
  deleteChat(id: string): Promise<void>;

  createMessage(message: {
    chatId: string;
    role: string;
    content: string | null;
  }): Promise<StoredMessage>;
  updateMessage(id: string, changes: MessageUpdate): Promise<StoredMessage>;
  deleteMessage(id: string): Promise<void>;
  /** A chat's messages, oldest first, leaving out any listed in excludeIds */
  listMessages(chatId: string, options?: { excludeIds?: string[] }): Promise<StoredMessage[]>;

  createToolCall(toolCall: NewToolCall): Promise<void>;
  finishToolCall(
    messageId: string,
    toolCallId: string,
    finished: { result: string; thought?: string | null }
  ): Promise<void>;

  createRequest(request: NewRequest): Promise<void>;
  requestTotals(chatId: string): Promise<RequestTotals>;

  createAgentSession(session: {
    agentClass: string;
    chatId: string;
    metadata: Record<string, unknown> | null;
  }): Promise<StoredAgentSession>;
  findAgentSession(id: string): Promise<StoredAgentSession | null>;
  updateAgentSession(id: string, changes: { metadata: Record<string, unknown> }): Promise<void>;
}

const storeMethods: (keyof ChatStore)[] = [
  "createChat",
  "createMessage",
  "updateMessage",
  "listMessages",
  "createRequest"
];

/** Whether a value is a ChatStore rather than a Prisma client. */
export function isChatStore(value: unknown): value is ChatStore {
  return (
    typeof value === "object" &&
    value !== null &&
    storeMethods.every((method) => typeof (value as any)[method] === "function")
  );
}
