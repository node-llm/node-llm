import { MCP } from "@node-llm/mcp";

/**
 * Example demonstrating Phase 2 Polish: Monitoring and Resource Templates.
 * 
 * Run with:
 * npx tsx examples/scripts/mcp/core-explorer/monitor-and-templates.ts
 */
async function main() {
  console.log("🚀 Initializing MCP with Monitoring...");

  // 1. Connect with monitoring
  const mcp = await MCP.connect({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()]
  });

  // 2. Subscribe to logs (Principal Engineer pattern)
  mcp.on("log", (msg) => {
    console.log(`\x1b[36m[SERVER LOG]\x1b[0m ${msg.trim()}`);
  });

  // 3. Subscribe to notifications
  mcp.on("notification", (notif) => {
    console.log(`\x1b[33m[PROTOCOL NOTIF]\x1b[0m ${notif.method}`);
  });

  console.log("🔍 Discovering Manifest...");
  const { tools, resourceTemplates } = await mcp.discover();

  console.log(`Found ${tools.length} tools`);
  console.log(`Found ${resourceTemplates.length} resource templates`);

  // 4. Working with Resource Templates
  if (resourceTemplates.length > 0) {
    const template = resourceTemplates[0];
    console.log(`\n📄 Template: ${template.name}`);
    console.log(`URI: ${template.uriTemplate}`);

    // If it's a filesystem server, it might have recursive templates or similar
    // For this example, we'll just log the metadata
  }

  await mcp.close();
  console.log("\n✅ Done.");
}

main().catch(console.error);
