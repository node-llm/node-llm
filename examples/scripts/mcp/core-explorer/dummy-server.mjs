import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema, 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "../../../../");

const server = new Server(
  { name: "code-explorer", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// --- TOOLS ---
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

// --- RESOURCES ---
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "repo://readme",
      name: "Repository README",
      description: "The main README file of the node-llm project",
      mimeType: "text/markdown"
    },
    {
      uri: "repo://package-json",
      name: "Root package.json",
      description: "The main package.json file",
      mimeType: "application/json"
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "repo://readme") {
    const content = await fs.readFile(path.join(REPO_ROOT, "README.md"), "utf-8");
    return {
      contents: [{ uri, mimeType: "text/markdown", text: content }]
    };
  }

  if (uri === "repo://package-json") {
    const content = await fs.readFile(path.join(REPO_ROOT, "package.json"), "utf-8");
    return {
      contents: [{ uri, mimeType: "application/json", text: content }]
    };
  }

  throw new Error("Resource not found");
});

// --- PROMPTS ---
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "explain-project",
      description: "Ask for an explanation of the node-llm project structure",
      arguments: [
        { name: "depth", description: "How deep to explain (summary or detailed)", required: false }
      ]
    }
  ]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "explain-project") {
    const depth = args?.depth || "summary";
    const text = depth === "detailed" 
      ? "Please provide a detailed explanation of the node-llm project, including all packages and their roles."
      : "Summarize the node-llm project structure and goals.";

    return {
      description: "Explain project prompt",
      messages: [
        {
          role: "user",
          content: { type: "text", text }
        }
      ]
    };
  }

  throw new Error("Prompt not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
