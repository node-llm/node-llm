import { Polly } from "@pollyjs/core";
import NodeHttpAdapter from "@pollyjs/adapter-node-http";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

Polly.register(NodeHttpAdapter);
Polly.register(FetchAdapter);
Polly.register(FSPersister);

export function setupVCR(recordingName: string) {
  const recordingsDir = path.resolve(__dirname, "../__cassettes__");
  const mode = (process.env.VCR_MODE as any) || "replay";

  // If in replay mode and no key is set, set a dummy key to avoid validation errors
  if (mode === "replay" && !process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = "sk-dummy-key-for-vcr-replay";
  }

  const polly = new Polly(recordingName, {
    adapters: ["node-http", "fetch"],
    persister: "fs",
    persisterOptions: {
      fs: {
        recordingsDir: recordingsDir,
      },
    },
    matchRequestsBy: {
      headers: {
        exclude: ["authorization", "openai-organization", "openai-project", "user-agent"],
      },
      body: false,
    },
    mode: mode,
    recordIfMissing: process.env.VCR_MODE === "record",
    flushRequestsOnStop: true,
  });

  const { server } = polly;

  server.any().on('beforePersist', (req: any, recording: any) => {
    // Scrub sensitive headers from requests
    const sensitiveHeaders = ['authorization', 'openai-organization', 'openai-project', 'api-key'];
    
    if (recording.request.headers) {
      recording.request.headers.forEach((header: any) => {
        if (sensitiveHeaders.includes(header.name.toLowerCase())) {
          header.value = "[REDACTED]";
        }
      });
    }

    // Scrub sensitive headers from responses
    if (recording.response.headers) {
      recording.response.headers.forEach((header: any) => {
        if (sensitiveHeaders.includes(header.name.toLowerCase())) {
          header.value = "[REDACTED]";
        }
      });
    }
  });

  return polly;
}
