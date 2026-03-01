import { ModerationRequest, ModerationResponse, ModerationResult } from "../Provider.js";
import { handleMistralError } from "./Errors.js";
import { logger } from "../../utils/logger.js";
import { fetchWithTimeout } from "../../utils/fetch.js";

const DEFAULT_MODERATION_MODEL = "mistral-moderation-latest";

interface MistralClassifierResponse {
  id: string;
  model: string;
  results: Array<{
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}

export class MistralModeration {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(request: ModerationRequest): Promise<ModerationResponse> {
    // Mistral's moderation API expects input as a list of conversations
    // Each conversation is a list of messages with role and content
    const inputs = Array.isArray(request.input) ? request.input : [request.input];

    // Convert strings to chat message format
    const formattedInput = inputs.map((text) => [{ role: "user", content: text }]);

    const body = {
      model: request.model || DEFAULT_MODERATION_MODEL,
      input: formattedInput
    };

    const url = `${this.baseUrl}/chat/moderations`;
    logger.logRequest("Mistral", "POST", url, body);

    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      },
      request.requestTimeout
    );

    if (!response.ok) {
      await handleMistralError(response, request.model || DEFAULT_MODERATION_MODEL);
    }

    const json = (await response.json()) as MistralClassifierResponse;
    logger.logResponse("Mistral", response.status, response.statusText, json);

    // Map Mistral's response format to our standard format
    const results: ModerationResult[] = json.results.map((result) => ({
      flagged: Object.values(result.categories).some((v) => v === true),
      categories: result.categories,
      category_scores: result.category_scores
    }));

    return {
      id: json.id,
      model: json.model,
      results
    };
  }
}
