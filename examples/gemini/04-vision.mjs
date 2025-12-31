import { LLM } from "../../packages/core/dist/index.js";
import "dotenv/config";

LLM.configure({
  provider: "gemini",
});

const chat = LLM.chat("gemini-2.0-flash");

// 1x1 Blue dot
const blueDot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

console.log("Analyzing image...");

const response = await chat.ask("What is the dominant color in this image?", {
  images: [blueDot]
});

console.log("Response:", String(response));
