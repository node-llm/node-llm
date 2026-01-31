import { createLLM, PIIMaskMiddleware, UsageLoggerMiddleware, CostGuardMiddleware } from "@node-llm/core";
import { hrChatbotMiddlewares } from "./middlewares";
import "dotenv/config";

/**
 * Core principle: NodeLLM is pure infrastructure.
 * This is an immutable instance created at startup.
 */
export const llm = createLLM({
  // Global defaults resolved from environment
  provider: (process.env.NODELLM_PROVIDER as any) || "openai",
  middlewares: [
    ...hrChatbotMiddlewares,
    new PIIMaskMiddleware(),
    new UsageLoggerMiddleware({ prefix: "HR-Bot" }),
    new CostGuardMiddleware({ maxCost: 1.0 }) // $1.00 safety limit per turn
  ]
});

// Freeze the instance to ensure it's immutable as per principles
Object.freeze(llm);
