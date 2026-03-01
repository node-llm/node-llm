import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  // Use a sample audio file from the audio folder
  const audioFile = path.resolve(__dirname, "../../audio/sample-0.mp3");

  try {
    console.log(`Transcribing ${audioFile}...`);
    console.log("Using model: voxtral-mini-latest\n");

    const result = await llm.transcribe(audioFile);

    console.log(`Model: ${result.model} | Duration: ${result.duration}s`);
    console.log("--- Content ---");
    console.log(result.text);

    if (result.segments && result.segments.length > 0) {
      console.log("\n--- Segments ---");
      result.segments.forEach((seg) => {
        console.log(`[${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s]: ${seg.text}`);
      });
    }
  } catch (e) {
    console.error("Transcription failed:", e.message);
  }
}

main().catch(console.error);
