import { providerRegistry } from "../registry.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

export function registerOpenAIProvider() {
  providerRegistry.register("openai", () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    return new OpenAIProvider({ apiKey });
  });
}
