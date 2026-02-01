import { Tool, z } from "@node-llm/core";
import { DocumentSearch } from "@/services/document-search";

class SearchDocumentsTool extends Tool<{ query: string }> {
  name = "search_hr_documents";
  
  description =
    "Search the company's HR policy documents for information about leave policies, remote work, benefits, compensation, or any other HR-related topics. Use this when the user asks about company policies.";
  
  schema = z.object({
    query: z
      .string()
      .describe("The search query or question to find relevant HR policy information"),
  });

  async execute({ query }: { query: string }) {
    const results = await DocumentSearch.search(query, 5); // Increased breadth
    console.log(`[SearchTool] Query: "${query}", Results: ${results.length}`);
    if (results.length > 0) {
      console.log(`[SearchTool] Top score: ${results[0].score.toFixed(4)} from ${results[0].metadata.source}`);
    }

    if (results.length === 0) {
      return "No relevant HR policy documents found for this query.";
    }

    const formattedResults = results
      .map((result, index) => {
        const { source } = result.metadata;
        // Removed explicit score to prevent LLM hesitation on '70%' matches
        return `[Document: ${source}]\n${result.content}`;
      })
      .join("\n\n---\n\n");

    return formattedResults;
  }
}

export const searchDocumentsTool = new SearchDocumentsTool();
