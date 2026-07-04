import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CreateMessageResultSchema
} from "@modelcontextprotocol/sdk/types.js";

/**
 * A minimal MCP server that has no LLM of its own. Instead of calling out to
 * an API directly, its "summarize_text" tool sends a `sampling/createMessage`
 * request back over the MCP connection, asking whichever client is talking
 * to it to run the completion on the client's own configured LLM.
 */
const server = new Server(
  { name: "sampling-demo", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "summarize_text",
      description: "Summarize a block of text in one sentence using the client's LLM",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "The text to summarize" }
        },
        required: ["text"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "summarize_text") {
    throw new Error("Tool not found");
  }

  // The server has no LLM access itself — it asks the client to sample one.
  const result = await server.request(
    {
      method: "sampling/createMessage",
      params: {
        messages: [
          {
            role: "user",
            content: { type: "text", text: `Summarize this in one sentence:\n\n${args.text}` }
          }
        ],
        systemPrompt: "You are a concise summarization assistant.",
        maxTokens: 200
      }
    },
    CreateMessageResultSchema
  );

  return {
    content: [{ type: "text", text: result.content.text }]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
