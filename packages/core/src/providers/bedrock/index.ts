/**
 * Bedrock Provider - Public Exports
 */

import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { BedrockProvider } from "./BedrockProvider.js";

export function registerBedrockProvider() {
  providerRegistry.register("bedrock", (config) => {
    const cfg = config || globalConfig;
    const region = cfg.bedrockRegion;

    if (!region) {
      throw new Error("bedrockRegion is not set in config or AWS_REGION environment variable");
    }

    // Check for API Key auth first
    if (cfg.bedrockApiKey) {
      return new BedrockProvider({
        region,
        apiKey: cfg.bedrockApiKey
      });
    }

    // Fall back to SigV4 auth
    if (cfg.bedrockAccessKeyId && cfg.bedrockSecretAccessKey) {
      return new BedrockProvider({
        region,
        accessKeyId: cfg.bedrockAccessKeyId,
        secretAccessKey: cfg.bedrockSecretAccessKey,
        sessionToken: cfg.bedrockSessionToken
      });
    }

    throw new Error(
      "Bedrock requires either bedrockApiKey (AWS_BEARER_TOKEN_BEDROCK) or " +
        "bedrockAccessKeyId/bedrockSecretAccessKey (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)"
    );
  });
}

export { BedrockProvider, BedrockConfig } from "./BedrockProvider.js";
export { BedrockChat } from "./Chat.js";
export * from "./types.js";
