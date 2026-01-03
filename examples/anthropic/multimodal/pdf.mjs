import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.resolve(__dirname, "../../documents/simple.pdf");

async function main() {
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found at ${pdfPath}`);
    process.exit(1);
  }
  // Use Claude 3.5 Sonnet for PDF support
  NodeLLM.configure({
      provider: "anthropic",
  });
  const chat = NodeLLM.chat("claude-3-5-haiku-20241022");

  console.log("Analyzing PDF...");
  
  try {
      // We pass the file path. The FileLoader will load it.
      // Note: For this to work as 'application/pdf', the FileLoader logic must support it.
      // Currently FileLoader supports images. 
      // If FileLoader treats it as text/binary, we depend on Utils.ts to see "application/pdf".
      
      const response = await chat.ask("Summarize this document", {
          files: [pdfPath]
      });

      console.log("Response:", response.content);
  } catch (e) {
      console.error(e);
  }
}

main().catch(console.error);
