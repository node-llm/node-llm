import { ModelInfo } from "../Provider.js";
import { fetchWithTimeout } from "../../utils/fetch.js";
import { handleXAIError } from "./Errors.js";
import { Capabilities } from "./Capabilities.js";

interface XAIModelResponse {
  data: Array<{
    id: string;
    created: number;
    owned_by: string;
  }>;
}

export class XAIModels {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async execute(): Promise<ModelInfo[]> {
    const url = `${this.baseUrl}/models`;
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      await handleXAIError(response);
    }

    const json = (await response.json()) as XAIModelResponse;

    return json.data.map((m) => {
      const caps = [];
      if (Capabilities.supportsVision(m.id)) caps.push("vision");
      if (Capabilities.supportsTools(m.id)) caps.push("tools");
      if (Capabilities.supportsStructuredOutput(m.id)) caps.push("structured_output");
      if (Capabilities.supportsReasoning(m.id)) caps.push("reasoning");

      return {
        id: m.id,
        name: m.id,
        provider: "xai",
        family: "grok",
        context_window: Capabilities.getContextWindow(m.id),
        max_output_tokens: null,
        modalities: { input: ["text", "image"], output: ["text"] },
        capabilities: caps,
        pricing: {}
      };
    });
  }
}
