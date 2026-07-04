import { createLLM } from "@node-llm/core";
import { MCP, createLLMSamplingHandler } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * MCP SAMPLING
 *
 * Sampling inverts the usual MCP direction: instead of the client asking the
 * server for tools/resources, the SERVER asks the CLIENT to run an LLM
 * completion on its behalf (see sampling-server.mjs). This lets a server
 * offer LLM-powered tools without needing its own API key.
 *
 * `createLLMSamplingHandler` answers those requests using a real NodeLLM
 * instance, so `sampling-server.mjs`'s "summarize_text" tool is actually
 * powered by whatever model/provider you configure here.
 *
 * TO RUN:
 * npx tsx sampling.ts
 */
async function run() {
  const llm = createLLM({ provider: "openai" });

  console.log("--- Connecting with sampling support enabled ---");
  const mcp = await MCP.connect(
    {
      command: "node",
      args: [path.join(__dirname, "sampling-server.mjs")]
    },
    {
      sampling: createLLMSamplingHandler(llm, "gpt-4o-mini")
    }
  );

  try {
    const tools = await mcp.discoverTools();
    console.log(
      "Discovered tools:",
      tools.map((t) => t.name)
    );

    const summarizeTool = tools.find((t) => t.name === "summarize_text");
    if (!summarizeTool) {
      throw new Error(
        "summarize_text tool not found — the server hides it unless the client declares sampling support"
      );
    }

    const text =
      "NodeLLM is a TypeScript library for building applications on top of large " +
      "language models. It provides a single, provider-agnostic interface for chat, " +
      "tool calling, structured output, and streaming across OpenAI, Anthropic, " +
      "Gemini, Bedrock, and more.";

    console.log("\n[Tool Call] summarize_text");
    const result = await summarizeTool.execute({ text });
    console.log("Server's tool result (produced via client-side sampling):");
    console.log(result.text);
  } finally {
    await mcp.close();
    console.log("\n--- Connection closed ---");
  }
}

run().catch((err) => {
  console.error("Sampling example failed:", err);
  process.exit(1);
});
