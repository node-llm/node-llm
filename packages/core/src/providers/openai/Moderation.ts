import { ModerationRequest, ModerationResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { DEFAULT_MODELS } from "../../constants.js";
import { buildUrl } from "./utils.js";
import { logger } from "../../utils/logger.js";

export class OpenAIModeration {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ModerationRequest): Promise<ModerationResponse> {
    const body = {
      input: request.input,
      model: request.model || DEFAULT_MODELS.MODERATION,
    };

    const url = buildUrl(this.baseUrl, '/moderations');
    logger.logRequest("OpenAI", "POST", url, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model || DEFAULT_MODELS.MODERATION);
    }

    const json = await response.json() as ModerationResponse;
    logger.logResponse("OpenAI", response.status, response.statusText, json);
    return json;
  }
}
