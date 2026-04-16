import { createLLM, Tool, z } from "../../../../packages/core/src/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * GITHUB MCP BRIDGE
 * This script connects node-llm to the official GitHub MCP server.
 * 
 * REQUIREMENTS:
 * 1. GITHUB_PERSONAL_ACCESS_TOKEN in your .env
 * 
 * TO RUN:
 * npx tsx github-bridge.ts
 */

class GitHubMCPTool extends Tool {
  name = "github_helper";
  description = "Access GitHub repository data such as issues, pull requests, and file contents.";
  
  // For this PoC, we'll keep the schema simple to allow the LLM to 'pass through' arguments
  schema = z.object({
    operation: z.enum(["get_issue", "list_issues", "get_file_contents"]).describe("The GitHub operation to perform"),
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
    issueNumber: z.number().optional().describe("Required for get_issue"),
    path: z.string().optional().describe("Required for get_file_contents")
  });

  async execute(args: any) {
    console.log(`\n[GitHub MCP] Executing: ${args.operation} on ${args.owner}/${args.repo}`);

    const transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ""
      }
    });

    const client = new Client(
      { name: "node-llm-github-bridge", version: "1.0.0" },
      { capabilities: {} }
    );

    try {
      await client.connect(transport);

      // Map our simplified bridge arguments to the official GitHub MCP tool arguments
      let toolName = "";
      let toolArgs = {};

      switch (args.operation) {
        case "list_issues":
          toolName = "list_issues";
          toolArgs = { owner: args.owner, repo: args.repo };
          break;
        case "get_issue":
          toolName = "get_issue";
          toolArgs = { owner: args.owner, repo: args.repo, issue_number: args.issueNumber };
          break;
        case "get_file_contents":
          toolName = "get_file_contents";
          toolArgs = { owner: args.owner, repo: args.repo, path: args.path };
          break;
      }

      const result = await client.callTool({
        name: toolName,
        arguments: toolArgs
      });

      return JSON.stringify(result.content);
    } catch (error: any) {
      return `GitHub MCP Error: ${error.message}`;
    } finally {
      await transport.close();
    }
  }
}

async function run() {
  if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    console.error("❌ Error: GITHUB_PERSONAL_ACCESS_TOKEN is missing in .env");
    process.exit(1);
  }

  const llm = createLLM({ provider: "openai" }); 
  const chat = llm.chat("gpt-4o-mini").withTools([new GitHubMCPTool()]);

  console.log("--- Starting GitHub MCP Test ---");
  
  // We'll ask it to check the status of the node-llm repo itself (if public) or any other.
  const response = await chat.ask("Look at the repository 'node-llm/node-llm' on GitHub and tell me the title of the most recent issue.");
  
  console.log("\n--- Final Analysis ---");
  console.log(response.content);
}

run().catch((err: any) => {
  console.error("Test failed:", err);
  process.exit(1);
});
