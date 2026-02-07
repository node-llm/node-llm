/**
 * HR Policy Agent
 * 
 * A class-based agent for HR policy queries using the Agent DSL.
 * Configuration is defined via static properties, following the "Code Wins" pattern.
 */

import { Agent, Tool, z } from "@node-llm/core";
import { DocumentSearch } from "@/services/document-search";

// --- Tool Definition ---

class SearchHRDocumentsTool extends Tool<{ query: string }> {
  name = "search_hr_documents";
  description =
    "Search the company's HR policy documents for information about leave policies, remote work, benefits, compensation, or any other HR-related topics. Use this when the user asks about company policies.";
  schema = z.object({
    query: z
      .string()
      .describe("The search query or question to find relevant HR policy information"),
  });

  async execute({ query }: { query: string }) {
    const results = await DocumentSearch.search(query, 5);
    console.log(`[SearchTool] Query: "${query}", Results: ${results.length}`);
    if (results.length > 0) {
      console.log(`[SearchTool] Top score: ${results[0].score.toFixed(4)} from ${results[0].metadata.source}`);
    }

    if (results.length === 0) {
      return "No relevant HR policy documents found for this query.";
    }

    const formattedResults = results
      .map((result) => {
        const { source } = result.metadata;
        return `[Document: ${source}]\n${result.content}`;
      })
      .join("\n\n---\n\n");

    return formattedResults;
  }
}

// --- Agent Definition ---

export class HRPolicyAgent extends Agent {
  static model = process.env.NODELLM_MODEL || "gpt-4o";
  static instructions = `
You are the official HR Assistant for our company. 

Core Principles:
1. ACCURACY: You answer based on the provided HR documents and policies. If multiple documents mention the same topic, synthesize the information for the user.
2. HELPFULNESS: Even if a direct answer isn't available, try to guide the user to the correct policy or document name found in the search results.
3. BOUNDARIES: If the information is truly absent from the registry, say: "I couldn't find a specific policy for that. Please check the HR portal or contact your manager."
4. TONE: Professional, efficient, and friendly.

Context Guidelines:
- You help employees find information quickly.
- Cite the source document name in your answer.
`.trim();
  
  static tools = [SearchHRDocumentsTool];
  static maxToolCalls = 10;
  static temperature = 0;
}
