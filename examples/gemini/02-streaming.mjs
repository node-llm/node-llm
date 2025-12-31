import { LLM } from "../../packages/core/dist/index.js";
import "dotenv/config";

LLM.configure({
  provider: "gemini",
});

const chat = LLM.chat("gemini-2.0-flash");

process.stdout.write("Gemini Streaming: ");

const stream = chat.stream("Write a short poem about a software agent.");

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}

process.stdout.write("\n\nDone!\n");
