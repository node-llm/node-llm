import { MODEL_ALIASES, resolveModelAlias } from "../../../packages/core/dist/index.js";

console.log("=== MODEL_ALIASES Export ===\n");

console.log("1. Check if alias exists:");
const userInput = "claude-3-5-haiku";
const isValidAlias = userInput in MODEL_ALIASES;
console.log(`   Is '${userInput}' a valid alias? ${isValidAlias}\n`);

console.log("2. Get all providers for an alias:");
const providers = Object.keys(MODEL_ALIASES["claude-3-5-haiku"]);
console.log(`   Providers supporting 'claude-3-5-haiku': ${providers.join(", ")}\n`);

console.log("3. Resolve alias for specific provider:");
const resolved = resolveModelAlias("claude-3-5-haiku", "anthropic");
console.log(`   'claude-3-5-haiku' for anthropic → '${resolved}'\n`);

console.log("4. List all available aliases:");
const allAliases = Object.keys(MODEL_ALIASES);
console.log(`   Total aliases: ${allAliases.length}`);
console.log(`   Sample: ${allAliases.slice(0, 5).join(", ")}, ...\n`);

console.log("5. Validate user input:");
function validateModelInput(input, provider) {
  if (input in MODEL_ALIASES) {
    if (MODEL_ALIASES[input][provider]) {
      return { valid: true, resolved: MODEL_ALIASES[input][provider] };
    }
    return { valid: false, reason: `Alias '${input}' not supported for provider '${provider}'` };
  }
  return { valid: true, resolved: input, note: "Using direct model ID" };
}

const validation1 = validateModelInput("claude-3-5-haiku", "anthropic");
console.log(`   Validation 1:`, validation1);

const validation2 = validateModelInput("gpt-4o", "anthropic");
console.log(`   Validation 2:`, validation2);

const validation3 = validateModelInput("custom-model-123", "anthropic");
console.log(`   Validation 3:`, validation3);
