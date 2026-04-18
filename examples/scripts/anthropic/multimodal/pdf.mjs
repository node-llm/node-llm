import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.resolve(__dirname, "../../documents/simple.pdf");

async function main() {
  const llm = createLLM({
    provider: "anthropic",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found at ${pdfPath}`);
    process.exit(1);
  }

  const chat = llm.chat("claude-3-haiku-20240307");

  console.log("Analyzing PDF...");

  try {
    // We pass the file path. The FileLoader will load it.
    const response = await chat.ask("Summarize this document", {
      files: [pdfPath]
    });

    console.log("Response:", response.content);
  } catch (e) {
    console.error(e);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
