import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchWithTimeout } from "../../../src/utils/fetch.js";

// Sends the headers and part of the body at once, then never finishes the body.
const stalling = () =>
  createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.write(" ");
  });

describe("fetchWithTimeout", () => {
  let server: Server;
  let url: string;

  beforeAll(async () => {
    server = stalling();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it("times out a body that stalls after the headers", async () => {
    const response = await fetchWithTimeout(url, {}, 100);
    await expect(response.json()).rejects.toThrow("Request timeout after 100ms");
  });

  it("leaves a stream's body alone once the headers arrive", async () => {
    const response = await fetchWithTimeout(url, {}, 100, { coverBody: false });
    const reader = response.body!.getReader();
    await reader.read();
    await new Promise((resolve) => setTimeout(resolve, 200));
    const next = await Promise.race([
      reader.read().then(
        () => "read",
        () => "aborted"
      ),
      new Promise((resolve) => setTimeout(() => resolve("waiting"), 50))
    ]);
    expect(next).toBe("waiting");
    await reader.cancel();
  });

  it("still lets the caller's signal abort the request", async () => {
    const controller = new AbortController();
    const response = await fetchWithTimeout(url, { signal: controller.signal }, 5_000);
    controller.abort();
    await expect(response.json()).rejects.toThrow();
  });
});
