import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  LLM.configure({ provider: "openai" });

  const chat = LLM.chat("gpt-4o");

  console.log("Analyzing multiple project files (README + code)...\n");
  
  // We can pass multiple local file paths directly
  const response = await chat.ask("Summarize the relationship between these files.", {
    files: [
      path.resolve(__dirname, "../../README.md"),
      path.resolve(__dirname, "../chat/basic.mjs")
    ]
  });

  console.log("Analysis:");
  console.log(response.content);
}

main().catch(console.error);
