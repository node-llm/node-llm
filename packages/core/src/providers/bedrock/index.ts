/**
 * Bedrock Provider - Public Exports
 */

import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { BedrockProvider } from "./BedrockProvider.js";
import { BedrockConfig } from "./config.js";

export function registerBedrockProvider() {
  providerRegistry.register("bedrock", (config) => {
    const cfg = config || globalConfig;
    const region = cfg.bedrockRegion;

    if (!region) {
      throw new Error("bedrockRegion is not set in config or AWS_REGION environment variable");
    }

    // Pass all available credentials to the provider.
    // BedrockProvider.validateBedrockConfig will ensure they are mutually exclusive.
    const bedrockConfig: BedrockConfig = {
      region,
      apiKey: cfg.bedrockApiKey,
      accessKeyId: cfg.bedrockAccessKeyId,
      secretAccessKey: cfg.bedrockSecretAccessKey,
      sessionToken: cfg.bedrockSessionToken,
      guardrailIdentifier: cfg.bedrockGuardrailIdentifier,
      guardrailVersion: cfg.bedrockGuardrailVersion
    };

    return new BedrockProvider(bedrockConfig);
  });
}

export { BedrockProvider, BedrockConfig } from "./BedrockProvider.js";
export { BedrockChat } from "./Chat.js";
export * from "./types.js";
