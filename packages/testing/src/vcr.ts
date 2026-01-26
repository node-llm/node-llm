import { Provider, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { Scrubber } from "./Scrubber.js";

// Try to import Vitest's expect to get test state, but don't fail if not in a test env
let vitestExpect: unknown;
try {
  // @ts-ignore
  import("vitest").then((m) => {
    vitestExpect = m.expect;
  });
} catch {
  // Not in vitest env
}

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

export interface VCROptions {
  mode?: VCRMode;
  scrub?: (data: unknown) => unknown;
  cassettesDir?: string;
}

export class VCR {
  private cassette: VCRCassette;
  private interactionIndex = 0;
  private mode: VCRMode;
  private filePath: string;
  private scrubber: Scrubber;

  constructor(name: string, options: VCROptions = {}, cassettesDir = ".llm-cassettes") {
    const targetDir = options.cassettesDir || cassettesDir;
    this.mode = options.mode || (process.env.VCR_MODE as VCRMode) || "auto";
    this.scrubber = new Scrubber({ customScrubber: options.scrub });
    this.filePath = path.join(process.cwd(), targetDir, `${this.slugify(name)}.json`);

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
      const interaction = this.scrubber.scrub({
        method,
        request: this.clone(request),
        response: this.clone(response)
      }) as VCRInteraction;

      this.cassette.interactions.push(interaction);
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
      const interaction = this.scrubber.scrub({
        method,
        request: this.clone(request),
        response: null,
        chunks: chunks.map((c) => this.clone(c))
      }) as VCRInteraction;

      this.cassette.interactions.push(interaction);
    }
  }

  private clone(obj: unknown) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  }
}

const EXECUTION_METHODS = ["chat", "stream", "paint", "transcribe", "moderate", "embed"];

export function setupVCR(name: string, options: VCROptions = {}) {
  const vcr = new VCR(name, options);

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

interface VitestExpect {
  getState: () => { currentTestName?: string };
}

/**
 * One-line DX Sugar for VCR testing.
 * Automatically handles setup, teardown, and naming.
 */
export function withVCR(fn: () => Promise<void>): () => Promise<void>;
export function withVCR(name: string, fn: () => Promise<void>): () => Promise<void>;
export function withVCR(options: VCROptions, fn: () => Promise<void>): () => Promise<void>;
export function withVCR(
  name: string,
  options: VCROptions,
  fn: () => Promise<void>
): () => Promise<void>;
export function withVCR(...args: unknown[]): () => Promise<void> {
  return async function () {
    let name: string | undefined;
    let options: VCROptions = {};
    let fn: () => Promise<void>;

    // logic to parse overloaded arguments
    if (typeof args[0] === "function") {
      fn = args[0] as () => Promise<void>;
    } else if (typeof args[0] === "string") {
      name = args[0];
      if (typeof args[1] === "function") {
        fn = args[1] as () => Promise<void>;
      } else {
        options = (args[1] as VCROptions) || {};
        fn = args[2] as () => Promise<void>;
      }
    } else {
      options = (args[0] as VCROptions) || {};
      fn = args[1] as () => Promise<void>;
    }

    // Auto-naming from Vitest
    if (!name && vitestExpect) {
      const state = (vitestExpect as VitestExpect).getState();
      name = state.currentTestName || "unnamed-test";
    }

    if (!name) {
      throw new Error(
        "VCR: Could not determine cassette name. Provide a name or run within Vitest."
      );
    }

    const vcr = setupVCR(name, options);
    try {
      await fn();
    } finally {
      await vcr.stop();
    }
  };
}
