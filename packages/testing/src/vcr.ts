import { Provider, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";

export type VCRMode = "record" | "replay" | "auto" | "passthrough";

export interface VCRInteraction {
  method: string;
  request: unknown;
  response: unknown;
  chunks?: unknown[];
}

export interface VCRCassette {
  name: string;
  interactions: VCRInteraction[];
}

export class VCR {
  private cassette: VCRCassette;
  private interactionIndex = 0;
  private mode: VCRMode;
  private filePath: string;

  constructor(name: string, mode: VCRMode = "auto", cassettesDir = ".llm-cassettes") {
    this.mode = mode || (process.env.VCR_MODE as VCRMode) || "auto";
    this.filePath = path.join(process.cwd(), cassettesDir, `${name}.json`);

    if (this.mode === "auto") {
      this.mode = fs.existsSync(this.filePath) ? "replay" : "record";
    }

    if (this.mode === "replay") {
      if (!fs.existsSync(this.filePath)) {
        throw new Error(`VCR[${name}]: Cassette file not found at ${this.filePath} in replay mode`);
      }
      this.cassette = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    } else {
      this.cassette = { name, interactions: [] };
    }
  }

  get currentMode() {
    return this.mode;
  }

  async stop() {
    if (this.mode === "record" && this.cassette.interactions.length > 0) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.cassette, null, 2));
    }
    // Unregister interceptor
    providerRegistry.setInterceptor(undefined);
  }

  public async execute(
    method: string,
    originalMethod: (...args: unknown[]) => Promise<unknown>,
    request: unknown
  ): Promise<unknown> {
    if (this.mode === "replay") {
      const interaction = this.cassette.interactions[this.interactionIndex++];
      if (!interaction) {
        throw new Error(`VCR[${this.cassette.name}]: No more interactions found for ${method}`);
      }
      if (interaction.method !== method) {
        throw new Error(
          `VCR[${this.cassette.name}]: Method mismatch. Expected ${interaction.method}, got ${method}`
        );
      }
      return interaction.response;
    }

    const response = await originalMethod(request);

    if (this.mode === "record") {
      this.cassette.interactions.push({
        method,
        request: this.clone(request),
        response: this.clone(response)
      });
    }

    return response;
  }

  public async *executeStream(
    method: string,
    originalMethod: (...args: unknown[]) => AsyncIterable<unknown>,
    request: unknown
  ): AsyncIterable<unknown> {
    if (this.mode === "replay") {
      const interaction = this.cassette.interactions[this.interactionIndex++];
      if (!interaction || !interaction.chunks) {
        throw new Error(
          `VCR[${this.cassette.name}]: No more streaming interactions found for ${method}`
        );
      }
      for (const chunk of interaction.chunks) {
        yield chunk;
      }
      return;
    }

    const stream = originalMethod(request);
    const chunks: unknown[] = [];

    for await (const chunk of stream) {
      if (this.mode === "record") chunks.push(this.clone(chunk));
      yield chunk;
    }

    if (this.mode === "record") {
      this.cassette.interactions.push({
        method,
        request: this.clone(request),
        response: null,
        chunks
      });
    }
  }

  private clone(obj: unknown) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }
}

const EXECUTION_METHODS = ["chat", "stream", "paint", "transcribe", "moderate", "embed"];

export function setupVCR(name: string, options: { mode?: VCRMode } = {}) {
  const vcr = new VCR(name, options.mode);

  providerRegistry.setInterceptor((provider: Provider) => {
    return new Proxy(provider, {
      get(target, prop, receiver) {
        const originalValue = Reflect.get(target, prop, receiver);
        const method = prop.toString();

        if (typeof originalValue === "function" && EXECUTION_METHODS.includes(method)) {
          return function (...args: unknown[]) {
            // Handle streaming methods
            if (method === "stream") {
              return vcr.executeStream(
                method,
                originalValue.bind(target) as (...args: unknown[]) => AsyncIterable<unknown>,
                args[0]
              );
            }

            // Handle standard Promise methods
            return vcr.execute(
              method,
              originalValue.bind(target) as (...args: unknown[]) => Promise<unknown>,
              args[0]
            );
          };
        }

        return originalValue;
      }
    });
  });

  return vcr;
}
