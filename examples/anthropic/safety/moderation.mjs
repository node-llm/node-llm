import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({
    provider: "anthropic",
  });

  console.log("Attempting to moderate content with Anthropic...");

  try {
    await LLM.moderate({
      input: "I want to hurt someone",
    });
  } catch (error) {
    console.log("Caught expected error:", error.message);
    if (error.message === "Anthropic doesn't support moderation") {
      console.log("✅ Error message matches expectation.");
    } else {
      console.log("❌ Error message does not match expectation:", error.message);
    }
  }
}

main();
