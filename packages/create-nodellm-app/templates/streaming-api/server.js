import { createServer } from "node:http";
import { NodeLLM } from "@node-llm/core";

const PORT = Number(process.env.PORT) || 3000;

// POST /chat with {"message": "..."} streams the answer back as Server-Sent Events.
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/chat") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Use POST /chat" }));
  }

  let body = "";
  for await (const part of req) body += part;

  let message;
  try {
    message = JSON.parse(body).message;
  } catch {
    message = undefined;
  }
  if (typeof message !== "string" || !message.trim()) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: 'Send JSON like {"message": "Hello"}' }));
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  // Stop generating (and paying for tokens) if the client disconnects.
  const controller = new AbortController();
  res.on("close", () => controller.abort());

  try {
    const chat = NodeLLM.chat(process.env.NODELLM_MODEL || undefined);
    for await (const chunk of chat.stream(message, { signal: controller.signal })) {
      if (chunk.content) res.write(`data: ${JSON.stringify({ text: chunk.content })}\n\n`);
    }
    res.write("event: done\ndata: {}\n\n");
  } catch (error) {
    if (!controller.signal.aborted) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  }
  res.end();
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(
    `Try: curl -N -X POST localhost:${PORT}/chat -H 'Content-Type: application/json' -d '{"message":"Tell me a joke"}'`
  );
});
