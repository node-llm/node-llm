import { config as globalConfig } from "../../config.js";
import { providerRegistry } from "../registry.js";
import { TypeSafeProvider } from "./TypeSafeProvider.js";

export * from "./TypeSafeProvider.js";

let registered = false;

export function registerTypeSafeProvider() {
  if (registered) return;

  providerRegistry.register("typesafe", (config) => {
    const cfg = config || globalConfig;
    const apiKey = cfg.typesafeApiKey;

    if (!apiKey) {
      throw new Error(
        "typesafeApiKey is not set in config or TYPESAFE_API_KEY environment variable"
      );
    }

    return new TypeSafeProvider({ apiKey, baseUrl: cfg.typesafeApiBase });
  });

  registered = true;
}

export const ensureTypeSafeRegistered = registerTypeSafeProvider;
