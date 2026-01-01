import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";
import path from "path";
import fs from "fs";

// Create a dummy PDF for testing
const dummyPdfPath = path.resolve("./test-document.pdf");

// Minimal valid PDF (Blank page)
const minimalPdfBase64 = "JVBERi0xLgoxIDAgb2JqPDwvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqPDwvS2lkc1szIDAgVl0vQ291bnQgMT4+ZW5kb2JqCjMgMCBvYmo8PC9QYXJlbnQgMiAwIFI+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNQQlRU9G";

// Let's create a dummy file with .pdf extension
const buffer = Buffer.from(minimalPdfBase64, 'base64');
fs.writeFileSync(dummyPdfPath, buffer);

async function main() {
  // Use Claude 3.5 Sonnet for PDF support
  LLM.configure({
      provider: "anthropic",
  });
  const chat = LLM.chat("claude-3-5-haiku-20241022");

  console.log("Analyzing PDF...");
  
  try {
      // We pass the file path. The FileLoader will load it.
      // Note: For this to work as 'application/pdf', the FileLoader logic must support it.
      // Currently FileLoader supports images. 
      // If FileLoader treats it as text/binary, we depend on Utils.ts to see "application/pdf".
      
      const response = await chat.ask("Summarize this document", {
          files: [dummyPdfPath]
      });

      console.log("Response:", response.content);
  } catch (e) {
      console.error(e);
  } finally {
      if (fs.existsSync(dummyPdfPath)) {
          fs.rmSync(dummyPdfPath);
      }
  }
}

main().catch(console.error);
