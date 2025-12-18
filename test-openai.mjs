import "dotenv/config";
import { LLM } from "./packages/core/dist/index.js";

LLM.configure({ provider: "openai" });

const chat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a concise assistant",
});

const reply = await chat.ask("Explain HTTP in one sentence");
console.log("LLM reply:", reply);
