import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY
  });
  const chat = llm.chat("gemini-2.0-flash");

  console.log("Analyzing local project files with Gemini context...");
  const response = await chat.ask("Summarize these files.", {
    files: [
      path.resolve(__dirname, "../../../README.md"),
      path.resolve(__dirname, "../chat/basic.mjs")
    ]
  });

  console.log("\nAnalysis:");
  console.log(response.content);
}

main().catch(e => { console.error(e); process.exit(1); });
