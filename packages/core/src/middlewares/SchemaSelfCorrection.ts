import { Middleware, MiddlewareContext, RequestDirective } from "../types/Middleware.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { logger } from "../utils/logger.js";

export interface SchemaSelfCorrectionOptions {
  /**
   * Maximum number of correction attempts.
   * Default is 2.
   */
  maxRetries?: number;
}

/**
 * Middleware that automatically detects schema validation errors in structured outputs
 * and re-prompts the model with specific feedback.
 */
export class SchemaSelfCorrectionMiddleware implements Middleware {
  public readonly name = "SchemaSelfCorrection";
  private readonly maxRetries: number;

  constructor(options: SchemaSelfCorrectionOptions = {}) {
    this.maxRetries = options.maxRetries ?? 2;
  }

  async onResponse(ctx: MiddlewareContext, result: ChatResponseString): Promise<RequestDirective> {
    // Only apply if a schema was provided
    if (!ctx.options?.schema) {
      return "CONTINUE";
    }

    // Check if valid
    if (result.isValid) {
      return "CONTINUE";
    }

    // It's invalid. Get the error.
    const error = result.validationError;
    if (!error) {
      return "CONTINUE";
    }

    // Keep track of correction rounds in context state
    const currentRounds = (ctx.state.correctionRounds as number) || 0;

    if (currentRounds < this.maxRetries) {
      ctx.state.correctionRounds = currentRounds + 1;

      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.warn(
        `[SchemaSelfCorrection] Validation failed for ${ctx.provider}/${ctx.model}. ` +
          `Round ${currentRounds + 1}/${this.maxRetries}. Error: ${errorMessage}`
      );

      // Return RETRY directive with feedback
      return {
        action: "RETRY",
        message: `Your previous response did not match the required JSON schema. 
Validation Error: ${errorMessage}

Please correct your output to strictly follow the schema and provided types.`
      };
    }

    // If we reached max retries, we just continue (or the user will get the validation error when calling .data)
    logger.error(
      `[SchemaSelfCorrection] Max retries (${this.maxRetries}) reached for ${ctx.provider}/${ctx.model}.`
    );
    return "CONTINUE";
  }
}
/**
 * Factory function for creating the self-correction middleware.
 */
export function SchemaSelfCorrection(
  options: SchemaSelfCorrectionOptions = {}
): SchemaSelfCorrectionMiddleware {
  return new SchemaSelfCorrectionMiddleware(options);
}
