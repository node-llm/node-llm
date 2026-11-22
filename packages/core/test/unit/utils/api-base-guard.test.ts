import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import http from "http";
import type { AddressInfo } from "net";
import { ApiBaseRefusedError, NetworkError } from "../../../src/errors/index.js";
import {
  apiBaseRulesFor,
  clearCustomApiBases,
  fetchApiBase,
  registerCustomApiBase
} from "../../../src/utils/ApiBaseGuard.js";
import { fetchWithTimeout } from "../../../src/utils/fetch.js";
import { checkApiBase } from "../../../src/providers/apiBase.js";

const hits: string[] = [];
let server: http.Server;
let port: number;

beforeAll(async () => {
  server = http.createServer((request, response) => {
    hits.push(`${request.method} ${request.url}`);
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      if (request.url === "/away") {
        response.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" });
        return response.end();
      }
      if (request.url === "/other-host") {
        response.writeHead(307, { location: `http://127.0.0.1:${port}/final` });
        return response.end();
      }
      if (request.url === "/same-host") {
        response.writeHead(307, { location: "/final" });
        return response.end();
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ method: request.method, url: request.url, body }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

afterEach(() => {
  clearCustomApiBases();
  hits.length = 0;
  vi.unstubAllGlobals();
});

const base = () => `http://localhost:${port}/v1`;
const post = { method: "POST", body: '{"q":1}', headers: { "content-type": "application/json" } };

describe("custom base URL checks", () => {
  it("only applies to base URLs set in config, not to a provider's default URL", () => {
    registerCustomApiBase(base());
    expect(apiBaseRulesFor(`${base()}/chat/completions`)).toBeDefined();
    expect(apiBaseRulesFor(`${base()}?key=1`)).toBeDefined();
    expect(apiBaseRulesFor(`http://localhost:${port}/v10/chat`)).toBeUndefined();
    expect(apiBaseRulesFor("https://api.openai.com/v1/chat/completions")).toBeUndefined();
  });

  it("checkApiBase remembers the base URL with its rules", () => {
    checkApiBase("openaiApiBase", `${base()}/`, {
      example: "https://api.example.com/v1",
      security: { blockPrivateNetwork: true }
    });
    expect(apiBaseRulesFor(`${base()}/chat/completions`)).toEqual({ blockPrivateNetwork: true });
  });

  it("keeps the strictest rules when two configs set the same base URL", () => {
    registerCustomApiBase(base(), { blockPrivateNetwork: true });
    registerCustomApiBase(base(), {});
    expect(apiBaseRulesFor(`${base()}/x`)).toEqual({ blockPrivateNetwork: true });
  });

  it("still reaches a private base URL by default, such as a local model server", async () => {
    registerCustomApiBase(base());
    const response = await fetchWithTimeout(`${base()}/chat`, post, 5000);
    expect(await response.json()).toMatchObject({ method: "POST", body: '{"q":1}' });
  });

  it("refuses a redirect to another host without following it", async () => {
    await expect(fetchApiBase(`http://localhost:${port}/away`, post, {})).rejects.toThrow(
      /redirect from localhost:\d+ to 169\.254\.169\.254/
    );
  });

  it("names the redirect's host, and is not a NetworkError so it isn't retried", async () => {
    const error = await fetchApiBase(`http://localhost:${port}/other-host`, post, {}).catch(
      (caught) => caught
    );
    expect(error).toBeInstanceOf(ApiBaseRefusedError);
    expect(error).not.toBeInstanceOf(NetworkError);
    expect(error.code).toBe("API_BASE_REFUSED");
    expect(error.host).toBe(`127.0.0.1:${port}`);
    expect(hits).not.toContain("POST /final");
  });

  it("follows a redirect within the same host, keeping a 307's method and body", async () => {
    const response = await fetchApiBase(`http://localhost:${port}/same-host`, post, {});
    expect(await response.json()).toMatchObject({ method: "POST", url: "/final", body: '{"q":1}' });
  });

  it("refuses a cloud metadata address before connecting", async () => {
    await expect(fetchApiBase("http://169.254.169.254/v1/chat", post, {})).rejects.toThrow(
      ApiBaseRefusedError
    );
    await expect(fetchApiBase("http://[::ffff:169.254.169.254]/v1", post, {})).rejects.toThrow(
      /metadata/
    );
    await expect(fetchApiBase("http://metadata.google.internal/v1", post, {})).rejects.toThrow(
      /metadata/
    );
  });

  it("with blockPrivateNetwork, refuses a name that resolves to a private address as it connects", async () => {
    registerCustomApiBase(base(), { blockPrivateNetwork: true });
    const error = await fetchWithTimeout(`${base()}/chat`, post, 5000).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiBaseRefusedError);
    expect(error.message).toMatch(/Refused to call localhost: it is a private address/);
    expect(hits).toHaveLength(0);
  });

  it("with blockPrivateNetwork, refuses a private IP address", async () => {
    await expect(
      fetchApiBase(`http://127.0.0.1:${port}/v1`, post, { blockPrivateNetwork: true })
    ).rejects.toThrow(/private address/);
    expect(hits).toHaveLength(0);
  });

  it("when the app replaced fetch, checks the host first and still refuses redirects elsewhere", async () => {
    const fake = vi.fn(async () => {
      return new Response(null, { status: 302, headers: { location: "http://10.0.0.5/admin" } });
    });
    vi.stubGlobal("fetch", fake);
    await expect(fetchApiBase("https://gateway.example.com/v1/chat", post, {})).rejects.toThrow(
      /redirect from gateway\.example\.com to 10\.0\.0\.5/
    );
    expect(fake).toHaveBeenCalledTimes(1);
    expect((fake.mock.calls[0] as unknown[])[1]).toMatchObject({ redirect: "manual" });
  });

  it("leaves requests to a default URL to plain fetch", async () => {
    const fake = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fake);
    await fetchWithTimeout("https://api.openai.com/v1/models", {}, 5000);
    expect((fake.mock.calls[0] as unknown[])[1]).not.toHaveProperty("redirect");
  });
});
