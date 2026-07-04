import "dotenv/config";
import { createLLM } from "../../../../packages/core/dist/index.js";

/**
 * Example: Additive Callback Stacking
 *
 * Calling an on*()/beforeRequest()/afterResponse() hook more than once used
 * to silently replace the previous handler. Now every registered handler
 * runs, so independent concerns (e.g. logging plus a UI update) can each
 * register their own handler without stepping on each other.
 */

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  const chat = llm.chat("gpt-4o-mini");

  // Two independent onEndMessage handlers - both fire.
  chat
    .onEndMessage((msg) => console.log(`🔔 [Audit] Logged response (${msg.total_tokens} tokens)`))
    .onEndMessage(() => console.log("🔔 [UI] Refreshing chat window..."));

  // Two independent beforeRequest hooks - each sees the previous one's output.
  chat
    .beforeRequest(async (messages) => {
      console.log("[Policy] Redacting SSNs...");
      return messages.map((m) => ({
        ...m,
        content: String(m.content).replace(/\d{3}-\d{2}-\d{4}/g, "[REDACTED-SSN]")
      }));
    })
    .beforeRequest(async (messages) => {
      console.log("[Logging] Sending to provider:", messages.at(-1)?.content);
      return messages;
    });

  await chat.ask("My SSN is 123-45-6789, can you confirm you received it?");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
