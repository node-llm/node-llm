import { Provider, providerRegistry } from "@node-llm/core";
import fs from "node:fs";
import path from "node:path";
import { Scrubber } from "./Scrubber.js";

// Internal state for nested scoping (Feature 12)
const currentVCRScopes: string[] = [];

// Try to import Vitest's expect to get test state
let vitestExpect: any;
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
  request: any;
  response: any;
  chunks?: any[];
}

export interface VCRCassette {
  name: string;
  version?: "1.0";
  metadata?: {
    recordedAt?: string;
    recordedFrom?: string;
    provider?: string;
    duration?: number;
  };
  interactions: VCRInteraction[];
}

export interface VCROptions {
  mode?: VCRMode;
  scrub?: (data: any) => any;
  cassettesDir?: string;
  scope?: string | string[]; // Allow single or multiple scopes
  sensitivePatterns?: RegExp[];
  sensitiveKeys?: string[];
}

export class VCR {
  private cassette: VCRCassette;
  private interactionIndex = 0;
  private mode: VCRMode;
  private filePath: string;
  private scrubber: Scrubber;
  private recordStartTime: number = 0;

  constructor(name: string, options: VCROptions = {}) {
    // 1. Merge Global Defaults
    // Explicitly merge arrays to avoid overwriting global sensitive keys/patterns
    const mergedOptions: VCROptions = {
      ...globalVCROptions,
      ...options,
      sensitivePatterns: [
        ...(globalVCROptions.sensitivePatterns || []),
        ...(options.sensitivePatterns || [])
      ],
      sensitiveKeys: [...(globalVCROptions.sensitiveKeys || []), ...(options.sensitiveKeys || [])]
    };

    // 2. Resolve Base Directory (Env -> Option -> Default)
    // Rails-inspired organization: cassettes belong inside the test folder
    const baseDir = mergedOptions.cassettesDir || process.env.VCR_CASSETTE_DIR || "test/cassettes";

    // 2. Resolve Hierarchical Scopes
    const scopes: string[] = [];
    if (Array.isArray(mergedOptions.scope)) {
      scopes.push(...mergedOptions.scope);
    } else if (mergedOptions.scope) {
      scopes.push(mergedOptions.scope);
    } else {
      scopes.push(...currentVCRScopes);
    }

    // 3. Construct Final Directory Path
    const targetDir = path.join(baseDir, ...scopes.map((s) => this.slugify(s)));

    // Robust path resolution: Never join CWD if the target is already absolute
    if (path.isAbsolute(targetDir)) {
      this.filePath = path.join(targetDir, `${this.slugify(name)}.json`);
    } else {
      this.filePath = path.join(process.cwd(), targetDir, `${this.slugify(name)}.json`);
    }

    const initialMode = mergedOptions.mode || (process.env.VCR_MODE as VCRMode) || "auto";
    const isCI = !!process.env.CI;
    const exists = fs.existsSync(this.filePath);

    // CI Enforcement
    if (isCI) {
      if (initialMode === "record") {
        throw new Error(`VCR[${name}]: Recording cassettes is not allowed in CI.`);
      }
      if (initialMode === "auto" && !exists) {
        throw new Error(
          `VCR[${name}]: Cassette missing in CI. Run locally to generate ${this.filePath}`
        );
      }
    }

    if (initialMode === "auto") {
      this.mode = exists ? "replay" : "record";
    } else {
      this.mode = initialMode;
    }

    this.scrubber = new Scrubber({
      customScrubber: mergedOptions.scrub,
      sensitivePatterns: mergedOptions.sensitivePatterns,
      sensitiveKeys: mergedOptions.sensitiveKeys
    });

    if (this.mode === "replay") {
      if (!exists) {
        throw new Error(`VCR[${name}]: Cassette not found at ${this.filePath}`);
      }
      this.cassette = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    } else {
      this.cassette = {
        name,
        version: "1.0",
        metadata: {
          recordedAt: new Date().toISOString()
        },
        interactions: []
      };
      this.recordStartTime = Date.now();
    }
  }

  get currentMode() {
    return this.mode;
  }

  async stop() {
    if (this.mode === "record" && this.interactionsCount > 0) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Update metadata with duration
      const duration = Date.now() - this.recordStartTime;
      if (this.cassette.metadata) {
        this.cassette.metadata.duration = duration;
      }

      fs.writeFileSync(this.filePath, JSON.stringify(this.cassette, null, 2));
    }
    providerRegistry.setInterceptor(undefined);
  }

  private get interactionsCount() {
    return this.cassette.interactions.length;
  }

  public async execute(
    method: string,
    originalMethod: (...args: any[]) => Promise<any>,
    request: any
  ): Promise<any> {
    if (this.mode === "replay") {
      const interaction = this.cassette.interactions[this.interactionIndex++];
      if (!interaction) {
        throw new Error(`VCR[${this.cassette.name}]: No more interactions for ${method}`);
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
    originalMethod: (...args: any[]) => AsyncIterable<any>,
    request: any
  ): AsyncIterable<any> {
    if (this.mode === "replay") {
      const interaction = this.cassette.interactions[this.interactionIndex++];
      if (!interaction || !interaction.chunks) {
        throw new Error(`VCR[${this.cassette.name}]: No streaming interactions found`);
      }
      for (const chunk of interaction.chunks) {
        yield chunk;
      }
      return;
    }

    const stream = originalMethod(request);
    const chunks: any[] = [];

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

  private clone(obj: any) {
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
          return function (...args: any[]) {
            if (method === "stream") {
              return vcr.executeStream(method, originalValue.bind(target), args[0]);
            }
            return vcr.execute(method, originalValue.bind(target), args[0]);
          };
        }
        return originalValue;
      }
    });
  });

  return vcr;
}

/**
 * One-line DX Sugar for VCR testing.
 */
export function withVCR(fn: () => Promise<void>): () => Promise<void>;
export function withVCR(name: string, fn: () => Promise<void>): () => Promise<void>;
export function withVCR(options: VCROptions, fn: () => Promise<void>): () => Promise<void>;
export function withVCR(
  name: string,
  options: VCROptions,
  fn: () => Promise<void>
): () => Promise<void>;
export function withVCR(...args: any[]): () => Promise<void> {
  // Capture scopes at initialization time
  const capturedScopes = [...currentVCRScopes];

  return async function () {
    let name: string | undefined;
    let options: VCROptions = {};
    let fn: () => Promise<void>;

    if (typeof args[0] === "function") {
      fn = args[0];
    } else if (typeof args[0] === "string") {
      name = args[0];
      if (typeof args[1] === "function") {
        fn = args[1];
      } else {
        options = args[1] || {};
        fn = args[2];
      }
    } else {
      options = args[0] || {};
      fn = args[1];
    }

    // Pass captured inherited scopes if not explicitly overridden
    if (capturedScopes.length > 0 && !options.scope) {
      options.scope = capturedScopes;
    }

    if (!name && vitestExpect) {
      const state = vitestExpect.getState();
      name = state.currentTestName || "unnamed-test";
    }

    if (!name) throw new Error("VCR: Could not determine cassette name.");

    const vcr = setupVCR(name, options);
    try {
      await fn();
    } finally {
      await vcr.stop();
    }
  };
}

// Global configuration for VCR
let globalVCROptions: VCROptions = {};

export function configureVCR(options: VCROptions) {
  globalVCROptions = { ...globalVCROptions, ...options };
}

export function resetVCRConfig(): void {
  globalVCROptions = {};
}

/**
 * Organizes cassettes by hierarchical subdirectories.
 */
export function describeVCR(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  currentVCRScopes.push(name);

  const finish = () => {
    currentVCRScopes.pop();
  };

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(finish);
    }
    finish();
    return result;
  } catch (err) {
    finish();
    throw err;
  }
}
