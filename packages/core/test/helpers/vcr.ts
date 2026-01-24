import { Polly } from "@pollyjs/core";
import NodeHttpAdapter from "@pollyjs/adapter-node-http";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Polly.register(NodeHttpAdapter as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Polly.register(FetchAdapter as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Polly.register(FSPersister as any);

export function setupVCR(recordingName: string, subDir?: string) {
  let recordingsDir = path.resolve(__dirname, "../__cassettes__");
  if (subDir) {
    recordingsDir = path.join(recordingsDir, subDir);
  }
  const mode = (process.env.VCR_MODE as "replay" | "record" | undefined) || "replay";

  // Provide dummy credentials for all providers if real ones are missing
  if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = "sk-dummy-key-for-vcr-replay";
  if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = "dummy-key-for-vcr-replay";
  if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "dummy-key-for-vcr-replay";
  if (!process.env.DEEPSEEK_API_KEY) process.env.DEEPSEEK_API_KEY = "dummy-key-for-vcr-replay";
  if (!process.env.OPENROUTER_API_KEY) process.env.OPENROUTER_API_KEY = "dummy-key-for-vcr-replay";

  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_BEARER_TOKEN_BEDROCK) {
    process.env.AWS_ACCESS_KEY_ID = "AKIA-DUMMY-KEY";
    process.env.AWS_SECRET_ACCESS_KEY = "dummy-secret-key";
  }
  if (!process.env.AWS_REGION) process.env.AWS_REGION = "us-east-1";

  const polly = new Polly(recordingName, {
    adapters: ["node-http", "fetch"],
    persister: "fs",
    persisterOptions: {
      fs: {
        recordingsDir: recordingsDir
      }
    },
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "openai-organization",
          "openai-project",
          "user-agent",
          "x-api-key",
          "host",
          ...(subDir === "bedrock"
            ? ["x-amz-date", "x-amz-content-sha256", "x-amz-security-token", "x-amz-target"]
            : [])
        ]
      },
      url: {
        pathname: (pathname: string) => {
          // Normalize Bedrock Guardrail URLs so record and replay match
          if (pathname.includes("/guardrail/")) {
            return pathname.replace(
              /\/guardrail\/[^/]+\/version\/[^/]+/,
              "/guardrail/dummy-guardrail-id/version/1"
            );
          }
          // Normalize Bedrock Model IDs in URLs (especially provisioned throughput ARNs)
          if (pathname.includes("/model/")) {
            return pathname.replace(/\/model\/[^/]+/, "/model/normalized-model-id");
          }
          return pathname;
        },
        query: (query: Record<string, unknown>) => {
          const { key: _key, ...rest } = query;
          return rest;
        }
      },
      body: false
    },
    mode: mode,
    recordIfMissing: process.env.VCR_MODE === "record",
    flushRequestsOnStop: true
  });

  const { server } = polly;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.any().on("beforePersist", (_req: unknown, recording: { request: any; response: any }) => {
    // Scrub sensitive headers from requests
    const sensitiveHeaders = [
      "authorization",
      "openai-organization",
      "openai-project",
      "api-key",
      "x-api-key"
    ];

    if (recording.request.headers) {
      recording.request.headers.forEach((header: { name: string; value: string }) => {
        if (sensitiveHeaders.includes(header.name.toLowerCase())) {
          header.value = "[REDACTED]";
        }
      });
    }

    // Scrub Bedrock Guardrail IDs from URL
    if (recording.request.url && recording.request.url.includes("bedrock-runtime")) {
      recording.request.url = recording.request.url.replace(
        /\/guardrail\/[^/]+\/version\/[^/]+/,
        "/guardrail/dummy-guardrail-id/version/1"
      );
    }

    // Scrub key from URL
    if (recording.request.url) {
      recording.request.url = recording.request.url.replace(/key=[^&]+/, "key=[REDACTED]");
    }

    // Scrub key from Query String
    if (recording.request.queryString) {
      recording.request.queryString.forEach((param: { name: string; value: string }) => {
        if (param.name === "key") {
          param.value = "[REDACTED]";
        }
      });
    }

    // Scrub sensitive headers from responses
    if (recording.response.headers) {
      recording.response.headers.forEach((header: { name: string; value: string }) => {
        if (sensitiveHeaders.includes(header.name.toLowerCase())) {
          header.value = "[REDACTED]";
        }
      });
    }
  });

  return polly;
}
