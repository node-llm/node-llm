import { llm } from "@/lib/node-llm";

interface SearchResult {
  content: string;
  score: number;
  metadata: {
    source: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export class DocumentSearch {
  static async search(query: string, topK: number = 3): Promise<SearchResult[]> {
    const { prisma } = await import("@/lib/db");
    
    const queryEmbedding = await llm.embed(query);
    const queryVector = JSON.stringify(queryEmbedding.vectors[0]);

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        content, 
        metadata, 
        (1 - (embedding <=> ${queryVector}::vector)) as score 
      FROM "DocumentChunk"
      ORDER BY embedding <=> ${queryVector}::vector
      LIMIT ${topK}
    `;

    return results.map((row) => {
      let metadata = row.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          console.warn("[DocumentSearch] Failed to parse metadata string:", metadata);
          metadata = { source: "unknown" };
        }
      }
      
      return {
        content: row.content,
        score: Number(row.score),
        metadata: metadata || { source: "unknown" },
      };
    });
  }
}
