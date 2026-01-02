
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  console.log("🦙 Ollama Vision Example");
  console.log("Note: Requires a vision-capable model (e.g., 'llama3.2-vision' or 'llava')");
  console.log("Run: ollama pull llama3.2-vision\n");
  
  LLM.configure({ provider: "ollama" });

  const chat = LLM.chat("llama3.2-vision");

  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";
  
  console.log("Analyzing image...");
  try {
    const response = await chat.ask("Describe this image in one sentence.", {
      files: [imageUrl]
    });

    console.log("Description:", response.content);
  } catch (error) {
     console.error("Error:", error.message);
  }
}
main();
