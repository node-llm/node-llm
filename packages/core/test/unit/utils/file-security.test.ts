import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FileLoader } from "../../../src/utils/FileLoader.js";
import { FileAccessError, isPrivateAddress } from "../../../src/utils/FileSecurity.js";

const dir = mkdtempSync(join(tmpdir(), "nodellm-files-"));
const root = join(dir, "uploads");
mkdirSync(root);
writeFileSync(join(root, "notes.txt"), "hello");
writeFileSync(join(dir, "outside.txt"), "secret");
writeFileSync(join(root, ".env"), "OPENAI_API_KEY=sk-test");
writeFileSync(join(root, "id_rsa"), "PRIVATE KEY");
symlinkSync(join(dir, "outside.txt"), join(root, "link.txt"));

describe("local files", () => {
  it("loads ordinary files with no rules, as before, including ones with no extension", async () => {
    writeFileSync(join(dir, "Dockerfile"), "FROM node");
    expect(await FileLoader.load(join(dir, "outside.txt"))).toMatchObject({ type: "text" });
    expect(await FileLoader.load(join(dir, "Dockerfile"))).toMatchObject({ type: "image_url" });
  });

  it("refuses files that hold secrets by default, even through a link", async () => {
    mkdirSync(join(dir, ".ssh"), { recursive: true });
    writeFileSync(join(dir, ".ssh", "config"), "Host x");
    writeFileSync(join(dir, "server.pem"), "KEY");
    writeFileSync(join(dir, ".env.production"), "KEY=1");
    symlinkSync(join(root, "id_rsa"), join(dir, "harmless.txt"));
    for (const file of [
      join(root, ".env"),
      join(dir, ".env.production"),
      join(root, "id_rsa"),
      join(dir, "server.pem"),
      join(dir, ".ssh", "config"),
      join(dir, "harmless.txt")
    ])
      await expect(FileLoader.load(file), file).rejects.toThrow(/may hold secrets/);
  });

  it("loads them when allowSensitiveFiles is set", async () => {
    expect(await FileLoader.load(join(root, ".env"), { allowSensitiveFiles: true })).toMatchObject({
      type: "image_url"
    });
  });

  it("refuses files outside root, including through a link", async () => {
    const rules = { root };
    expect(await FileLoader.load(join(root, "notes.txt"), rules)).toMatchObject({ type: "text" });
    await expect(FileLoader.load(join(dir, "outside.txt"), rules)).rejects.toBeInstanceOf(
      FileAccessError
    );
    await expect(FileLoader.load(join(root, "../outside.txt"), rules)).rejects.toThrow(
      /outside the allowed folder/
    );
    await expect(FileLoader.load(join(root, "link.txt"), rules)).rejects.toThrow(
      /outside the allowed folder/
    );
  });
});

describe("remote files", () => {
  let server: Server;
  let base: string;
  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === "/redirect") {
        res.writeHead(302, { location: "/cat.png" });
        return res.end();
      }
      if (req.url === "/to-metadata") {
        res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" });
        return res.end();
      }
      if (req.url === "/huge") {
        res.writeHead(200, { "content-type": "image/png" });
        const chunk = Buffer.alloc(1024 * 1024);
        let sent = 0;
        const send = () => {
          while (sent < 60 && res.write(chunk)) sent++;
          if (sent < 60) res.once("drain", send);
          else res.end();
        };
        return send();
      }
      res.writeHead(200, { "content-type": "image/png" });
      res.end(Buffer.from("png"));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it("fetches private addresses and follows redirects with no rules, as before", async () => {
    const part = await FileLoader.load(`${base}/redirect`);
    expect((part as { image_url: { url: string } }).image_url.url).toMatch(/^data:image\/png/);
  });

  it("refuses cloud metadata addresses by default, directly or through a redirect", async () => {
    for (const url of [
      "http://169.254.169.254/latest/meta-data/",
      "http://[fd00:ec2::254]/latest/",
      "http://metadata.google.internal/computeMetadata/v1/",
      `${base}/to-metadata`
    ])
      await expect(FileLoader.load(url), url).rejects.toThrow(/cloud instance metadata/);
  });

  it("refuses every private address with blockPrivateNetwork", async () => {
    await expect(FileLoader.load(`${base}/cat.png`, { blockPrivateNetwork: true })).rejects.toThrow(
      /private address/
    );
  });

  it("refuses hosts that aren't allowed", async () => {
    await expect(
      FileLoader.load(`${base}/cat.png`, { allowedHosts: ["cdn.example.com"] })
    ).rejects.toThrow(/not an allowed host/);
    expect(await FileLoader.load(`${base}/cat.png`, { allowedHosts: ["127.0.0.1"] })).toMatchObject(
      {
        type: "image_url"
      }
    );
  });

  it("passes a URL that failed on to the provider, as before, unless throwOnFetchError", async () => {
    const missing = "http://127.0.0.1:1/cat.png";
    expect(await FileLoader.load(missing)).toEqual({
      type: "image_url",
      image_url: { url: missing }
    });
    await expect(FileLoader.load(missing, { throwOnFetchError: true })).rejects.toThrow();
  });

  it("checks the address the connection uses, not only a lookup before it", async () => {
    // localhost resolves to a loopback address in the connection's own lookup.
    await expect(
      FileLoader.load(`http://localhost:${new URL(base).port}/cat.png`, {
        blockPrivateNetwork: true,
        throwOnFetchError: true
      })
    ).rejects.toThrow(/private address/);
  });
  it("checks Gemini and OpenAI's own loaders and transcription files too", async () => {
    const { BinaryUtils } = await import("../../../src/utils/Binary.js");
    const { AudioUtils } = await import("../../../src/utils/audio.js");
    await expect(BinaryUtils.toBase64(`${base}/to-metadata`)).rejects.toThrow(/metadata/);
    await expect(BinaryUtils.toBase64(join(root, ".env"))).rejects.toThrow(/may hold secrets/);
    await expect(AudioUtils.load(join(root, "id_rsa"))).rejects.toThrow(/may hold secrets/);
    expect((await BinaryUtils.toBase64(`${base}/cat.png`))?.mimeType).toBe("image/png");
  });
  it("stops reading a body without a length once it passes the limit", async () => {
    await expect(FileLoader.load(`${base}/huge`, { throwOnFetchError: true })).rejects.toThrow(
      /exceeding the limit/
    );
  });
});

describe("isPrivateAddress", () => {
  it("knows private, loopback, link-local and mapped addresses", () => {
    for (const ip of [
      "10.0.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.20.1.1",
      "192.168.1.15",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1"
    ])
      expect(isPrivateAddress(ip), ip).toBe(true);
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111", "172.32.0.1"])
      expect(isPrivateAddress(ip), ip).toBe(false);
  });
});

describe("fileSecurity on a chat", () => {
  it("applies the rules from createLLM to ask()", async () => {
    const { createLLM } = await import("../../../src/llm.js");
    const provider = {
      id: "test",
      chat: async () => ({
        content: "ok",
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
      }),
      defaultModel: () => "test-model",
      capabilities: { supportsVision: () => true }
    };
    const llm = createLLM({ provider: provider as never, fileSecurity: { root } });

    await expect(
      llm
        .chat("test-model", { assumeModelExists: true })
        .ask("Read", { files: [join(dir, "outside.txt")] })
    ).rejects.toBeInstanceOf(FileAccessError);
    expect(
      String(
        await llm
          .chat("test-model", { assumeModelExists: true })
          .ask("Read", { files: [join(root, "notes.txt")] })
      )
    ).toBe("ok");
  });
});

describe("review follow-ups", () => {
  it("judges IPv6 forms that carry an IPv4 address by that address", async () => {
    const { isMetadataAddress: meta } = await import("../../../src/utils/FileSecurity.js");
    for (const ip of [
      "::ffff:a9fe:a9fe",
      "::ffff:169.254.169.254",
      "64:ff9b::a9fe:a9fe",
      "::a9fe:a9fe",
      "192.0.0.192",
      "fd00:ec2:0:0:0:0:0:254"
    ])
      expect(meta(ip), ip).toBe(true);
    for (const ip of ["::ffff:7f00:1", "64:ff9b::7f00:1", "fec0::1", "::ffff:10.0.0.1"])
      expect(isPrivateAddress(ip), ip).toBe(true);
    expect(isPrivateAddress("::ffff:808:808")).toBe(false);
    await expect(FileLoader.load("http://[::ffff:169.254.169.254]/")).rejects.toThrow(/metadata/);
  });

  it("refuses devices and more files that hold secrets", async () => {
    await expect(FileLoader.load("/dev/zero")).rejects.toBeInstanceOf(FileAccessError);
    const { isSensitiveFile } = await import("../../../src/utils/FileSecurity.js");
    for (const name of [
      "prod.env",
      ".envrc",
      ".env-production",
      "secrets.yml",
      "config/database.yml",
      "application_default_credentials.json",
      "my-service-account.json",
      ".git/config",
      ".vault-token",
      ".my.cnf",
      "/proc/self/environ",
      "terraform.tfstate",
      "id_rsa_work"
    ])
      expect(isSensitiveFile(join(dir, name)) || isSensitiveFile(name), name).toBe(true);
    for (const name of ["notes.txt", "Dockerfile", "README.md", "data.json", "app.yml"])
      expect(isSensitiveFile(join(dir, name)), name).toBe(false);
  });

  it("merges rules from config and the chat", async () => {
    const { mergeFileSecurity } = await import("../../../src/utils/FileSecurity.js");
    expect(mergeFileSecurity({ root, blockPrivateNetwork: true }, { fetchTimeout: 5 })).toEqual({
      root,
      blockPrivateNetwork: true,
      fetchTimeout: 5
    });
    expect(mergeFileSecurity(undefined, undefined)).toBeUndefined();
  });
});
