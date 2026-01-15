import { NodeLLM } from '@node-llm/core';
import dotenv from 'dotenv';

dotenv.config();

export const agent = NodeLLM.withProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
});

export const anthropic = NodeLLM.withProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Primary orchestrator instance
export const systemAuditCore = agent;
