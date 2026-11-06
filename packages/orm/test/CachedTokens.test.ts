/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { PrismaStore } from "../src/adapters/prisma/PrismaStore.js";

const request = {
  chatId: "chat-1",
  messageId: "message-1",
  provider: "azure",
  model: "gpt-6",
  statusCode: 200,
  duration: 900,
  inputTokens: 12000,
  outputTokens: 80,
  cachedTokens: 9000,
  cost: 0.001
};

const prismaWith = (fields: Record<string, unknown> | undefined) => {
  const create = vi.fn();
  return { client: { llmRequest: { fields, create } } as any, create };
};

describe("cached tokens on requests", () => {
  it("saves the tokens a provider served from its cache when the database has the column", async () => {
    const { client, create } = prismaWith({ inputTokens: {}, cachedTokens: {} });

    await new PrismaStore(client).createRequest(request);

    expect(create).toHaveBeenCalledWith({ data: request });
  });

  it("saves requests as before on a database set up before the column existed", async () => {
    const { client, create } = prismaWith({ inputTokens: {} });

    await new PrismaStore(client).createRequest(request);

    const { cachedTokens: _cached, ...before } = request;
    expect(create).toHaveBeenCalledWith({ data: before });
  });
});
