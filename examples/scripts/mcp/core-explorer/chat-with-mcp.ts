import { createLLM } from "@node-llm/core";
import { MCPRegistry } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env for LLM credentials
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * CHAT WITH MCP
 * 
 * This example shows how to bridge Discovery (Resources/Prompts) with Execution (Chat).
 * 
 * TO RUN:
 * npx tsx chat-with-mcp.ts
 */
async function run() {
  console.log("--- Connecting to Code Explorer ---");

  const registry = await MCPRegistry.connect({
    command: "node",
    args: [path.join(__dirname, "dummy-server.mjs")]
  });

  try {
    // 1. Load Context from a Resource
    console.log("[Resource] Fetching project README...");
    const resources = await registry.discoverResources();
    const readmeResource = resources.find(r => r.uri === "repo://readme");
    
    if (!readmeResource) throw new Error("README resource not found");
    const readmeContent = await readmeResource.read();
    const contextText = readmeContent.contents[0].text;

    // 2. Load a specialized Prompt Template
    console.log("[Prompt] Resolving 'explain-project' template...");
    const prompts = await registry.discoverPrompts();
    const explainPrompt = prompts.find(p => p.name === "explain-project");
    
    if (!explainPrompt) throw new Error("Explain prompt not found");
    const resolvedPrompt = await explainPrompt.get({ depth: "detailed" });
    const userQuery = (resolvedPrompt.messages[0].content as any).text;

    // 3. Kick off the Chat
    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini");

    console.log("\n--- Starting LLM Chat with Resource Context and Prompt Template ---");
    console.log(`Prompt Source: ${explainPrompt.name}`);
    console.log(`Resource Source: ${readmeResource.uri}\n`);

    const response = await chat.ask(
      `CONTEXT:\n${contextText}\n\n` +
      `QUERY FROM TEMPLATE: ${userQuery}`
    );

    console.log("--- AI Analysis ---");
    console.log(response.content);

  } finally {
    await registry.close();
    console.log("\n[Lifecycle] MCP Connection closed.");
  }
}

run().catch(console.error);
