/**
 * LLM Facade
 * 
 * This file serves as the main entry point for all AI capabilities.
 * It hides the architectural complexity of agents, providers, and tools
 * behind a clean, simple API surface.
 */

export { auditBrand, getAuditStream } from './llm/agent.js';
