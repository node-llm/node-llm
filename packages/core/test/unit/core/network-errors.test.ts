import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { NetworkError } from "../../../src/errors/index.js";
import { Provider } from "../../../src/providers/Provider.js";
import { fetchWithTimeout } from "../../../src/utils/fetch.js";
import { isFallbackError } from "../../../src/executor/Fallback.js";

// A port nothing listens on: taken, then closed again.
async function closedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

const networkError = () =>
  new NetworkError(
    "Could not reach api.example.com: fetch failed (ECONNRESET)",
    "api.example.com",
    {
      cause: new TypeError("fetch failed")
    }
  );

describe("network errors", () => {
  it("turns a failed connection into a NetworkError with the host and the cause", async () => {
    const port = await closedPort();

    for (const timeout of [undefined, 5_000]) {
      const error = await fetchWithTimeout(`http://127.0.0.1:${port}/v1`, {}, timeout).catch(
        (caught) => caught
      );

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toMatchObject({ code: "NETWORK_ERROR", host: `127.0.0.1:${port}` });
      expect(error.message).toBe(`Could not reach 127.0.0.1:${port}: fetch failed (ECONNREFUSED)`);
      expect(error.cause).toBeInstanceOf(TypeError);
    }
  });

  it("leaves a cancellation as it is", async () => {
    const port = await closedPort();
    const controller = new AbortController();
    controller.abort();

    const error = await fetchWithTimeout(`http://127.0.0.1:${port}`, {
      signal: controller.signal
    }).catch((caught) => caught);

    expect(error).not.toBeInstanceOf(NetworkError);
    expect(error.name).toBe("AbortError");
  });

  it("retries a request that could not reach the provider", async () => {
    let calls = 0;
    const provider = {
      id: "test",
      async chat() {
        calls++;
        if (calls < 3) throw networkError();
        return { content: "ok" };
      }
    };
    const llm = createLLM({
      provider: provider as unknown as Provider,
      retry: { attempts: 3, delayMs: 1 }
    });

    expect(String(await llm.chat("test").ask("hi"))).toBe("ok");
    expect(calls).toBe(3);
  });

  it("throws the NetworkError once the retries are used up", async () => {
    const provider = {
      id: "test",
      async chat() {
        throw networkError();
      }
    };
    const llm = createLLM({
      provider: provider as unknown as Provider,
      retry: { attempts: 2, delayMs: 1 }
    });

    await expect(llm.chat("test").ask("hi")).rejects.toBeInstanceOf(NetworkError);
  });

  it("moves on to a fallback model", () => {
    expect(isFallbackError(networkError())).toBe(true);
    expect(isFallbackError(new TypeError("fetch failed"))).toBe(true);
  });
});
