import { Agent, type ToolResolvable } from "@node-llm/core";
import { searchDocumentsTool } from "@/tools/search-documents";

export interface HRAssistantInputs {
  userName?: string;
}

/**
 * HRAssistant Agent
 * 
 * Uses the new Agent DSL for declarative configuration.
 */
export class HRAssistant extends Agent<HRAssistantInputs> {
  static model = process.env.NODELLM_MODEL || "gpt-4o";
  static provider = process.env.NODELLM_PROVIDER || "openai";
  static temperature = 0.5;
  static maxToolCalls = 10;

  static instructions = (inputs: HRAssistantInputs) => `
You are the official HR Assistant for our company. 
${inputs.userName ? `You are currently helping ${inputs.userName}.` : ""}

Core Principles:
1. ACCURACY: You answer based on the provided HR documents and policies. If multiple documents mention the same topic, synthesize the information for the user.
2. HELPFULNESS: Even if a direct answer isn't available, try to guide the user to the correct policy or document name found in the search results.
3. BOUNDARIES: If the information is truly absent from the registry, say: "I couldn't find a specific policy for that. Please check the HR portal or contact your manager."
4. TONE: Professional, efficient, and friendly.

Context Guidelines:
- You help employees find information quickly.
- Cite the source document name in your answer.
`.trim();

  static tools: ToolResolvable[] = [searchDocumentsTool];
}

/**
 * @deprecated Use HRAssistant class directly
 */
export const HR_ASSISTANT_DEFINITION = {
  instructions: HRAssistant.instructions({}),
  defaultModel: HRAssistant.model,
  defaultProvider: HRAssistant.provider,
  maxToolCalls: HRAssistant.maxToolCalls
};
