import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

LLM.configure({ 
  provider: "openai",
  defaultTranscriptionModel: "whisper-1"
});

async function main() {
  // Use a file from the audio folder
  const audioFile = path.resolve(__dirname, "../audio/sample-0.mp3");

  try {
    console.log(`Transcribing ${audioFile}...`);
    const transcription = await LLM.transcribe(audioFile, { model: "gpt-4o-transcribe" });
    
    console.log(`\nModel: ${transcription.model}`);
    console.log(`Duration: ${transcription.duration}s`);
    console.log("--- Transcription segments ---");
    transcription.segments.forEach(segment => {
      console.log(`${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s: ${segment.text}`);
    });
    console.log("------------------------------");
    
    console.log("\nFull Text:");
    console.log(transcription.text);
  } catch (e) {
    console.error("Transcription failed:", e.message);
    console.log("\nNote: Please ensure you have a valid audio file at ../audio/sample-0.mp3 or update the path in this script.");
  }
}

main();
