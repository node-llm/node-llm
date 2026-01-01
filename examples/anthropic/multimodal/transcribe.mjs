import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({
    provider: "anthropic",
  });

  console.log("Attempting to transcribe audio with Anthropic...");

  try {
    await LLM.transcribe({
      file: "dummy.mp3",
    });
  } catch (error) {
    console.log("Caught expected error:", error.message);
    if (error.message === "Anthropic doesn't support transcription") {
      console.log("✅ Error message matches expectation.");
    } else {
      console.log("❌ Error message does not match expectation:", error.message);
    }
  }
}

main();
