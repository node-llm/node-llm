import { Middleware, MiddlewareContext, RequestDirective } from "../types/Middleware.js";
import { ChatResponseString } from "../chat/ChatResponse.js";
import { ToolCall } from "../chat/Tool.js";
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

  async onToolCallError(
    ctx: MiddlewareContext,
    toolCall: ToolCall,
    error: unknown
  ): Promise<"CONTINUE" | "STOP" | "RETRY"> {
    // Check if it's a validation error (ZodError)
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      const currentRounds = (ctx.state.correctionRounds as number) || 0;

      if (currentRounds < this.maxRetries) {
        ctx.state.correctionRounds = currentRounds + 1;

        logger.warn(
          `[SchemaSelfCorrection] Tool validation failed for '${toolCall.function.name}'. ` +
            `Round ${currentRounds + 1}/${this.maxRetries}.`
        );

        // We return CONTINUE here because Chat.ts already handles pushing the error to history
        // BUT we could potentially change the error message to be more helpful!
        // However, Chat.ts currently just takes the error.message.
        // If we want to override the message, we'd need onToolCallError to return a descriptive RETRY or similar.
        // Currently Chat.ts's onToolCallError only returns "CONTINUE" | "STOP" | "RETRY".
        return "CONTINUE";
      }
    }

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
