import { createLLM } from "@node-llm/core";
import { MCP } from "../../../../packages/mcp/src/index.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * PUPPETEER MCP EXAMPLE
 * Demonstrates an AI agent that can browse the web.
 */
async function run() {
  console.log("--- Starting @node-llm/mcp Web Browser (Puppeteer) ---");

  // 1. Connect to Puppeteer MCP server
  // This server allows the AI to navigate, click, and screenshot.
  const mcp = await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"]
  });

  try {
    const tools = await mcp.discover();
    console.log(`[Registry] Discovered ${tools.length} browser tools.`);

    const llm = createLLM({ provider: "openai" });
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Dynamic web research.");
    
    const response = await chat.ask(
        "Please navigate to 'https://news.ycombinator.com', " +
        "find the title of the top post, and tell me what it is."
    );

    console.log("\n--- AI Response ---");
    console.log(response.content);

  } catch (err) {
    console.error("Browser Operation Failed:", err);
  } finally {
    await mcp.close();
    console.log("\n[Lifecycle] MCP Connection closed.");
  }
}

run().catch(console.error);
