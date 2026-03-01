import "dotenv/config";
import { NodeLLM } from "../../../../packages/core/dist/index.js";

async function main() {
  const llm = NodeLLM.withProvider("mistral");

  // Example 1: Math reasoning with magistral-small
  console.log("=== Example 1: Math Reasoning (magistral-small-latest) ===");
  const mathResponse = await llm.chat("magistral-small-latest").ask(
    "What is the sum of the first 100 prime numbers? Show your reasoning."
  );

  console.log("\n--- Response ---");
  console.log(mathResponse.content);

  if (mathResponse.reasoning) {
    console.log("\n--- Reasoning Trace ---");
    console.log(mathResponse.reasoning);
  }

  // Example 2: Logic puzzle with magistral-medium
  console.log("\n\n=== Example 2: Logic Puzzle (magistral-medium-latest) ===");
  const logicResponse = await llm.chat("magistral-medium-latest").ask(`
    Three friends - Alice, Bob, and Carol - each have a different pet: a cat, a dog, and a fish.
    - Alice doesn't have the fish.
    - Bob doesn't have the cat.
    - The person with the dog is not Carol.
    Who has which pet?
  `);

  console.log("\n--- Response ---");
  console.log(logicResponse.content);

  if (logicResponse.reasoning) {
    console.log("\n--- Reasoning Trace ---");
    console.log(logicResponse.reasoning.slice(0, 500) + "...");
  }

  // Example 3: Coding problem
  console.log("\n\n=== Example 3: Algorithm Design ===");
  const codingResponse = await llm.chat("magistral-medium-latest").ask(
    "Design an efficient algorithm to find the longest palindromic substring in a given string. Explain the time and space complexity."
  );

  console.log("\n--- Response ---");
  console.log(codingResponse.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
