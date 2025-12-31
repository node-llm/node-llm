import { LLM } from "../../packages/core/dist/index.js";
import "dotenv/config";

LLM.configure({
  provider: "gemini",
});

console.log("Fetching Gemini models...\n");
const models = await LLM.listModels();

console.log(`Found ${models.length} models:`);
console.table(models.map(m => ({
  id: m.id,
  name: m.name,
  context: m.context_window,
  modalities: m.modalities.input.join(", ")
})));

const flash = models.find(m => m.id === "gemini-2.0-flash");
if (flash) {
  console.log("\nDetails for Gemini 2.0 Flash:");
  console.log(JSON.stringify(flash, null, 2));
}
