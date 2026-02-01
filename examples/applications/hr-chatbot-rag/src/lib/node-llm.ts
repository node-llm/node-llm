import { createLLM, PIIMaskMiddleware, CostGuardMiddleware } from "@node-llm/core";
import { createPrismaMonitor } from "@node-llm/monitor";
import { hrChatbotMiddlewares } from "./middlewares";
import { prisma } from "./db";
import "dotenv/config";

/**
 * Advanced monitoring instance for the HR repository.
 */
const monitor = createPrismaMonitor(prisma, {
  captureContent: true 
});

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
    monitor,
    new CostGuardMiddleware({ maxCost: 1.0 }) // $1.00 safety limit per turn
  ]
});

// Freeze the instance to ensure it's immutable as per principles
Object.freeze(llm);
