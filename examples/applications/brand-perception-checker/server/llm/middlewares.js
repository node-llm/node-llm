/**
 * Brand Perception Checker Middleware Stack
 * 
 * Production-grade middlewares for the brand audit system.
 */

import { monitorMiddleware } from "./monitoring.js";

/**
 * Combined middleware stack for brand perception checker
 * Includes monitoring for all LLM operations
 */
export const productionMiddlewares = [
  monitorMiddleware
];
