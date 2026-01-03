import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  const chat = NodeLLM.chat("gpt-4o-mini");

  // Example 1: Basic streaming
  console.log("=== Example 1: Basic Streaming ===");
  for await (const chunk of chat.stream("Count from 1 to 5 slowly.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 2: Streaming with error handling
  console.log("=== Example 2: Streaming with Error Handling ===");
  try {
    for await (const chunk of chat.stream("Explain quantum computing.")) {
      process.stdout.write(chunk.content || "");
    }
    console.log("\n");
  } catch (error) {
    console.error("Streaming error:", error.message);
  }

  // Example 3: Streaming with manual abort
  console.log("=== Example 3: Streaming with Abort Controller ===");
  const controller = new AbortController();
  
  // Abort after 2 seconds
  const timeout = setTimeout(() => {
    console.log("\n[Aborting stream...]");
    controller.abort();
  }, 2000);

  try {
    for await (const chunk of chat.stream("Write a long story about a dragon.", controller)) {
      process.stdout.write(chunk.content || "");
    }
  } catch (error) {
    if (error.name === 'AbortError') {
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
  const chatWithHistory = NodeLLM.chat("gpt-4o-mini");
  
  // First message
  await chatWithHistory.ask("My name is Alice.");
  
  // Stream second message that references history
  console.log("Streaming response:");
  for await (const chunk of chatWithHistory.stream("What's my name?")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 5: Streaming with system instructions
  console.log("=== Example 5: Streaming with System Instructions ===");
  const chatWithSystem = NodeLLM.chat("gpt-4o-mini")
    .withInstructions("You are a pirate. Always respond in pirate speak.");
  
  for await (const chunk of chatWithSystem.stream("Tell me about the ocean.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 6: Streaming with temperature control
  console.log("=== Example 6: Streaming with High Temperature (Creative) ===");
  const creativeChat = NodeLLM.chat("gpt-4o-mini").withTemperature(1.5);
  
  for await (const chunk of creativeChat.stream("Invent a new word.")) {
    process.stdout.write(chunk.content || "");
  }
  console.log("\n");

  // Example 7: Collecting full response while streaming
  console.log("=== Example 7: Collecting Full Response ===");
  let fullResponse = "";
  
  for await (const chunk of chat.stream("What is 2+2?")) {
    const content = chunk.content || "";
    process.stdout.write(content);
    fullResponse += content;
  }
  
  console.log("\n\nFull collected response:", fullResponse);
  console.log("\n");

  // Example 8: Streaming with empty/null handling
  console.log("=== Example 8: Robust Chunk Handling ===");
  for await (const chunk of chat.stream("Say hi.")) {
    // Handle potential null/undefined content
    const content = chunk.content ?? "";
    if (content) {
      process.stdout.write(content);
    }
  }
  console.log("\n");

  // Example 9: Multiple concurrent streams (advanced)
  console.log("=== Example 9: Sequential Streams ===");
  const questions = [
    "What is AI?",
    "What is ML?",
    "What is DL?"
  ];

  for (const question of questions) {
    console.log(`\nQ: ${question}`);
    console.log("A: ");
    for await (const chunk of chat.stream(question)) {
      process.stdout.write(chunk.content || "");
    }
    console.log();
  }

  console.log("\n=== All streaming examples completed ===");
}

main().catch(console.error);
