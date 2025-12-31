import { ModerationRequest, ModerationResponse } from "../Provider.js";
import { handleOpenAIError } from "./Errors.js";
import { DEFAULT_MODELS } from "../../constants.js";

export class OpenAIModeration {
  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async execute(request: ModerationRequest): Promise<ModerationResponse> {
    const response = await fetch(`${this.baseUrl}/moderations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: request.input,
        model: request.model || DEFAULT_MODELS.MODERATION,
      }),
    });

    if (!response.ok) {
      await handleOpenAIError(response, request.model || DEFAULT_MODELS.MODERATION);
    }

    return (await response.json()) as ModerationResponse;
  }
}
