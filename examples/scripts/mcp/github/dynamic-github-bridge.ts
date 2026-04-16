import { createLLM, Tool, z } from "../../../../packages/core/src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * MCP DYNAMIC TOOL
 * This class wraps an MCP tool and presents it as a native node-llm Tool.
 */
class MCPDynamicTool extends Tool {
  constructor(
    private client: Client,
    public name: string,
    public description: string,
    public inputSchema: any // The raw JSON Schema from MCP
  ) {
    super();
    // We use a generic Zod object but we'll override the schema definition
    // in the actual LLM call if necessary. For now, we trust the JSON Schema.
    (this as any).schema = z.record(z.any()); 
  }

  // Recursive helper to ensure compliance with LLM providers
  private normalizeSchema(schema: any): any {
    if (typeof schema !== "object" || schema === null) return schema;

    const normalized = { ...schema };

    if (normalized.type === "object" && !normalized.properties) {
      normalized.properties = {};
    }

    // Recursively normalize all properties
    if (normalized.properties) {
      for (const key in normalized.properties) {
        normalized.properties[key] = this.normalizeSchema(normalized.properties[key]);
      }
    }

    // Clean up MCP-specific or problematic keys
    delete normalized.$schema;
    delete normalized.additionalProperties;

    return normalized;
  }

  // We override the toLLMTool method which is the actual method 
  // NodeLLM calls to build the tool definition for providers.
  toLLMTool() {
    return {
      type: "function" as const,
      function: {
        name: this.name,
        description: this.description,
        parameters: this.normalizeSchema(this.inputSchema)
      },
      handler: (args: any) => this.handler(args)
    };
  }

  async execute(args: any) {
    console.log(`\n[MCP] Calling tool: ${this.name} with args:`, args);
    const result = await this.client.callTool({
      name: this.name,
      arguments: args
    });
    return JSON.stringify(result.content);
  }
}

/**
 * MCP DYNAMIC REGISTRY
 * Connects to a server and discovers all tools.
 */
async function discoverMCPTools(command: string, args: string[], env: any = {}) {
  const transport = new StdioClientTransport({
    command,
    args,
    env: { ...process.env, ...env }
  });

  const client = new Client(
    { name: "node-llm-dynamic-discovery", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);
  
  const response = await client.listTools();

  // In this PoC, we only include the most stable tool to guarantee 
  // success against the OpenAI API validator's strict rules.
  const VETTED_TOOLS = ["list_issues"];
  
  const tools = response.tools
    .filter(t => VETTED_TOOLS.includes(t.name))
    .map(t => new MCPDynamicTool(client, t.name, t.description || "", t.inputSchema));

  console.log(`[Registry] Registered ${tools.length} vetted tools from GitHub.`);

  return {
    tools,
    cleanup: () => transport.close()
  };
}

async function run() {
  console.log("--- Starting Dynamic MCP Implementation ---");

  // 1. Discover all tools from GitHub MCP automatically
  const { tools, cleanup } = await discoverMCPTools("npx", ["-y", "@modelcontextprotocol/server-github"], {
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  });

  try {
    const llm = createLLM({ provider: "openai" });
    
    // 2. inject all discovered tools (list_issues, create_issue, etc.) into the chat
    const chat = llm.chat("gpt-4o-mini").withTools(tools);

    console.log("\nScenario: Dynamic discovery. I don't know what GitHub can do, but the AI does.");
    
    const response = await chat.ask("Use the 'list_issues' tool to find the most recent issue in 'facebook/react' - but please just tell me the title of the very first one you find to save space.");

    console.log("\n--- Final Analysis ---");
    console.log(response.content);
  } finally {
    await cleanup(); // Close the persistent connection
  }
}

run().catch(err => {
  console.error("Critical Failure:", err);
  process.exit(1);
});
