import { Provider } from "../providers/Provider.js";
import { logger } from "../utils/logger.js";

export interface ValidationOptions {
  assumeModelExists?: boolean;
}

export class ChatValidator {
  static validateVision(provider: Provider, model: string, hasBinary: boolean, options: ValidationOptions) {
    if (!hasBinary) return;
    
    if (!options.assumeModelExists && provider.capabilities && !provider.capabilities.supportsVision(model)) {
      throw new Error(`Model ${model} does not support vision/binary files.`);
    }
    
    if (options.assumeModelExists) {
      logger.warn(`Skipping vision capability validation for model ${model}`);
    }
  }

  static validateTools(provider: Provider, model: string, hasTools: boolean, options: ValidationOptions) {
    if (!hasTools) return;

    if (!options.assumeModelExists && provider.capabilities && !provider.capabilities.supportsTools(model)) {
      throw new Error(`Model ${model} does not support tool calling.`);
    }

    if (options.assumeModelExists) {
      logger.warn(`Skipping tool capability validation for model ${model}`);
    }
  }

  static validateStructuredOutput(provider: Provider, model: string, hasSchema: boolean, options: ValidationOptions) {
    if (!hasSchema) return;

    if (!options.assumeModelExists && provider.capabilities && !provider.capabilities.supportsStructuredOutput(model)) {
      throw new Error(`Model ${model} does not support structured output.`);
    }

    if (options.assumeModelExists) {
      logger.warn(`Skipping structured output capability validation for model ${model}`);
    }
  }
}
