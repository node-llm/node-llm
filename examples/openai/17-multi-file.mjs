import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o");

  console.log("--- Testing Multi-File Support ---\n");

  // Analyze multiple files at once
  console.log("Analyzing multiple project files (README + code examples)...\n");
  const response = await chat.ask("Analyze these files and summarize what this project does", {
    files: [
      path.resolve(__dirname, "../../README.md"),
      path.resolve(__dirname, "./01-basic-chat.mjs"),
      path.resolve(__dirname, "./03-tool-calling.mjs")
    ]
  });

  console.log("Analysis:");
  console.log(response.content);
  console.log(`\nTokens used: ${response.total_tokens}`);
}

main().catch(console.error);
