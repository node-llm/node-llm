import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const llm = createLLM({
    provider: "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY,
    defaultTranscriptionModel: "gemini-2.0-flash"
  });

  const audioFile = path.resolve(__dirname, "../../audio/sample-0.mp3");

  try {
    console.log(`Transcribing ${audioFile} with Gemini...`);
    const result = await llm.transcribe(audioFile);
    console.log(`\nContent: ${result.text}`);
  } catch (e) {
    console.error("Transcription failed:", e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
