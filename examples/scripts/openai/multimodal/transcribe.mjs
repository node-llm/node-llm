import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const llm = NodeLLM.withProvider("openai");

  // Use a sample audio file from the project or provide your own via CLI
  const audioFile = process.argv[2] || path.resolve(__dirname, "../../audio/sample-0.mp3");

  try {
    console.log(`🎙️  Transcribing: ${audioFile}`);
    console.log("--------------------------------------------------");
    
    const result = await llm.transcribe(audioFile, {
      model: "whisper-1",
      timestamp_granularities: ["word", "segment"],
      prompt: "OpenAI, Whisper, NodeLLM, transcription."
    });

    console.log(`✅ Success | Model: ${result.model} | Duration: ${result.duration?.toFixed(2)}s`);
    console.log("\n--- Full Transcript ---");
    console.log(result.text);

    if (result.segments.length > 0) {
      console.log("\n--- Segments (First 3) ---");
      result.segments.slice(0, 3).forEach(s => {
        const speaker = s.speaker ? `[${s.speaker}] ` : "";
        console.log(`${speaker}(${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s): ${s.text}`);
      });
    }

    if (result.words?.length > 0) {
      console.log("\n--- Word Level (Sample) ---");
      const sampleWords = result.words.slice(0, 8).map(w => `${w.word}(${w.start}s)`).join(" ");
      console.log(`${sampleWords} ...`);
    }

    console.log("\n--- Metadata (.meta) ---");
    console.log(`Segments: ${result.meta?.segments?.length}`);
    console.log(`Words: ${result.meta?.words?.length}`);

  } catch (e) {
    if (e.message.includes("ENOENT")) {
      console.error(`❌ Audio file not found: ${audioFile}`);
      console.log("\nUsage: node examples/scripts/openai/multimodal/transcribe.mjs <path-to-audio-file>");
    } else {
      console.error("❌ Transcription failed:", e.stack || e.message);
    }
    process.exit(1);
  }
}



main().catch(e => { console.error(e); process.exit(1); });
