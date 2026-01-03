import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  NodeLLM.configure({ 
    provider: "openai",
    defaultTranscriptionModel: "whisper-1"
  });

  // Use a sample audio file from the project root
  const audioFile = path.resolve(__dirname, "../../audio/sample-0.mp3");

  try {
    console.log(`Transcribing ${audioFile}...`);
    const result = await NodeLLM.transcribe(audioFile);
    
    console.log(`\nModel: ${result.model} | Duration: ${result.duration}s`);
    console.log("--- Content ---");
    console.log(result.text);
    
  } catch (e) {
    console.error("Transcription failed:", e.message);
  }
}

main().catch(console.error);
