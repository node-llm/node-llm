import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "gemini",
  });

  console.log("Attempting to moderate content with Gemini...");

  try {
    await NodeLLM.moderate({
      input: "I want to hurt someone",
    });
  } catch (error) {
    console.log("Caught expected error:", error.message);
    if (error.message === "Gemini doesn't support moderation") {
      console.log("✅ Error message matches expectation.");
    } else {
      console.log("❌ Error message does not match expectation:", error.message);
    }
  }
}

main();
