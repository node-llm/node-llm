import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "../../../");

const server = new Server(
  { name: "code-explorer", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_source_files",
      description: "List all .ts files in the core package source directory",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "read_source_file",
      description: "Read the content of a specific file in the core package",
      inputSchema: {
        type: "object",
        properties: {
          relativePath: { type: "string", description: "Path relative to packages/core/src" }
        },
        required: ["relativePath"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_source_files") {
    const srcPath = path.join(REPO_ROOT, "packages/core/src");
    const files = await fs.readdir(srcPath, { recursive: true });
    return {
      content: [{ type: "text", text: files.filter(f => f.endsWith(".ts")).join("\n") }]
    };
  }

  if (name === "read_source_file") {
    const fullPath = path.join(REPO_ROOT, "packages/core/src", args.relativePath);
    const content = await fs.readFile(fullPath, "utf-8");
    return {
      content: [{ type: "text", text: content }]
    };
  }

  throw new Error("Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
