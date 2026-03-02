import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");
  const chat = llm.chat("mistral-large-latest");

  // Example 1: Basic streaming
  console.log("=== Example 1: Basic Streaming ===");
  for await (const chunk of chat.stream("Count from 1 to 5 slowly.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 2: Streaming with error handling
  console.log("=== Example 2: Streaming with Error Handling ===");
  try {
    for await (const chunk of chat.stream("Explain quantum computing briefly.")) {
      process.stdout.write(chunk.content || "");
    }
    console.log("\n");
  } catch (error) {
    console.error("Streaming error:", error.message);
  }

  // Example 3: Streaming with abort controller
  console.log("=== Example 3: Streaming with Abort Controller ===");
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    console.log("\n[Aborting stream...]");
    controller.abort();
  }, 2000);

  try {
    for await (const chunk of chat.stream("Write a long story about a dragon.", controller)) {
      process.stdout.write(chunk.content || "");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("\n[Stream aborted successfully]");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    clearTimeout(timeout);
  }
  console.log("\n");

  // Example 4: Streaming with conversation history
  console.log("=== Example 4: Streaming with History ===");
  const chatWithHistory = llm.chat("mistral-large-latest");

  await chatWithHistory.ask("My name is Alice.");

  console.log("Streaming response:");
  for await (const chunk of chatWithHistory.stream("What's my name?")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 5: Streaming with system instructions
  console.log("=== Example 5: Streaming with System Instructions ===");
  const chatWithSystem = llm.chat("mistral-large-latest").withInstructions(
    "You are a pirate. Always respond in pirate speak."
  );

  for await (const chunk of chatWithSystem.stream("Tell me about the ocean.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 6: Collecting full response while streaming
  console.log("=== Example 6: Collecting Full Response ===");
  let fullResponse = "";

  for await (const chunk of chat.stream("What is 2+2?")) {
    const content = chunk.content || "";
    process.stdout.write(content);
    fullResponse += content;
  }

  console.log("\n\nFull collected response:", fullResponse);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
