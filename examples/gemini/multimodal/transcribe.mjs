import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  NodeLLM.configure({ 
    provider: "gemini",
    defaultTranscriptionModel: "gemini-2.0-flash"
  });

  const audioFile = path.resolve(__dirname, "../../audio/sample-0.mp3");

  try {
    console.log(`Transcribing ${audioFile} with Gemini...`);
    const result = await NodeLLM.transcribe(audioFile);
    console.log(`\nContent: ${result.text}`);
  } catch (e) {
    console.error("Transcription failed:", e.message);
  }
}

main().catch(console.error);
