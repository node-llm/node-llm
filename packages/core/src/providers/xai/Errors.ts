import {
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
  ServerError,
  NotFoundError
} from "../../errors/index.js";

export async function handleXAIError(response: Response, model?: string): Promise<never> {
  const status = response.status;
  let errorMessage = `xAI API identification failed with status ${status}`;
  let errorData: any = {};

  try {
    const text = await response.text();
    console.error("XAI ERROR RESPONSE:", text);
    errorData = JSON.parse(text);
    errorMessage = errorData.error?.message || errorMessage;
  } catch (_e) {
    // Ignore JSON parsing errors
  }

  const provider = "xai";

  switch (status) {
    case 401:
      throw new AuthenticationError(errorMessage, status, errorData, provider);
    case 400:
      throw new BadRequestError(errorMessage, errorData, provider, model);
    case 404:
      throw new NotFoundError(errorMessage, status, errorData, provider, model);
    case 429:
      throw new RateLimitError(errorMessage, errorData, provider, model);
    case 500:
    case 502:
    case 503:
    case 504:
      throw new ServerError(errorMessage, status, errorData, provider, model);
    default:
      throw new APIError(errorMessage, status, errorData, provider, model);
  }
}
