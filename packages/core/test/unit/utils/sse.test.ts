import { describe, it, expect, vi } from "vitest";
import { normalizeSseBuffer } from "../../../src/utils/sse.js";
import { OpenAIStreaming } from "../../../src/providers/openai/Streaming.js";

describe("server-sent event line endings", () => {
  it("turns CRLF and CR into LF, so event boundaries are found", () => {
    expect(normalizeSseBuffer('data: {"a":1}\r\n\r\ndata: x\rdata: y')).toBe(
      'data: {"a":1}\n\ndata: x\ndata: y'
    );
  });

  it("keeps a trailing CR until its LF arrives in the next read", () => {
    const first = normalizeSseBuffer('data: {"a":1}\r\n\r');
    expect(first).toBe('data: {"a":1}\n\r');
    expect(normalizeSseBuffer(first + "\n")).toBe('data: {"a":1}\n\n');
  });

  it("streams text from CRLF-framed events, with a boundary split across reads", async () => {
    const event = (text: string) =>
      `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\r\n\r\n`;
    const body = `${event("Hel")}${event("lo")}data: [DONE]\r\n\r\n`;
    const cut = body.indexOf("\r\n\r\n") + 3; // between the "\r" and the last "\n"
    const reads = [body.slice(0, cut), body.slice(cut)].map((part) => ({
      value: new TextEncoder().encode(part),
      done: false
    }));
    const read = vi.fn();
    reads.forEach((each) => read.mockResolvedValueOnce(each));
    read.mockResolvedValueOnce({ done: true });
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: { getReader: () => ({ read }) } });

    const streaming = new OpenAIStreaming("https://gateway.test/v1", "test-key");
    let text = "";
    for await (const chunk of streaming.execute({
      model: "gpt-4",
      messages: [{ role: "user", content: "hi" }]
    }))
      text += chunk.content ?? "";

    expect(text).toBe("Hello");
  });
});
