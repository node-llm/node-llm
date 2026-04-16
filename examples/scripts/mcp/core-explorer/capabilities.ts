import { MCPRegistry } from "../../../../packages/mcp/src/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CAPABILITIES EXPLORER
 * This script demonstrates Phase 2 discovery features: Tools, Resources, and Prompts.
 * 
 * TO RUN:
 * npx tsx capabilities.ts
 */

async function run() {
  console.log("--- Connecting to Code Explorer MCP Server ---");

  const registry = await MCPRegistry.connect({
    command: "node",
    args: [path.join(__dirname, "dummy-server.mjs")]
  });

  try {
    // 1. Discover Tools
    console.log("\n[Tools Discovery]");
    const tools = await registry.discoverTools();
    tools.forEach(t => console.log(` - ${t.name}: ${t.description}`));

    // 2. Discover Resources
    console.log("\n[Resources Discovery]");
    const resources = await registry.discoverResources();
    for (const r of resources) {
      console.log(` - ${r.name} (${r.uri}): ${r.description}`);
      
      // Showcase reading a resource if it's the package-json
      if (r.uri === "repo://package-json") {
          const result = await r.read();
          console.log(`   (Successfully read ${r.name}, contains ${result.contents[0].text.substring(0, 50)}...)`);
      }
    }

    // 3. Discover Prompts
    console.log("\n[Prompts Discovery]");
    const prompts = await registry.discoverPrompts();
    for (const p of prompts) {
      console.log(` - ${p.name}: ${p.description}`);
      
      // Showcase getting a prompt template
      const promptResult = await p.get({ depth: "summary" });
      console.log(`   Sample template message: "${promptResult.messages[0].content.text}"`);
    }

  } finally {
    await registry.close();
    console.log("\n--- Connection Closed ---");
  }
}

run().catch((err) => {
  console.error("Exploration failed:", err);
  process.exit(1);
});
