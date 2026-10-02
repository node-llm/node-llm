import { JudgmentAnswerData, JudgmentRequest, JudgmentResponse } from "../Provider.js";
import { NamedQuestion } from "../../judge/Question.js";
import {
  APIError,
  AuthenticationError,
  BadRequestError,
  InvalidModelError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError
} from "../../errors/index.js";

/**
 * The System One protocol: one request carries the input as `state` and a map
 * of typed questions; the response carries one typed answer per question.
 *
 * Wire names differ from ours in two places. A probability question is a
 * `noul` ("not unlikely"), and its yes/no descriptions are keyed "true" and
 * "false".
 */

const WIRE_TYPES = { probability: "noul", choice: "choice", score: "score" } as const;
const OUTCOME_KEYS: Record<string, string> = {
  yes: "true",
  true: "true",
  no: "false",
  false: "false"
};
const RESERVED = ["model", "state", "questions"];

function renderQuestion(question: NamedQuestion): Record<string, unknown> {
  let criteria: unknown;
  switch (question.type) {
    case "probability":
      criteria = question.criteria
        ? Object.fromEntries(
            Object.entries(question.criteria).map(([key, value]) => [OUTCOME_KEYS[key], value])
          )
        : undefined;
      break;
    case "choice":
      criteria = question.options;
      break;
    case "score":
      criteria = question.levels;
      break;
  }

  const rendered: Record<string, unknown> = { type: WIRE_TYPES[question.type] };
  if (question.instructions !== undefined && question.instructions !== null) {
    rendered.instructions = question.instructions;
  }
  if (criteria !== undefined) rendered.criteria = criteria;
  return rendered;
}

export function renderJudgmentPayload(request: JudgmentRequest): Record<string, unknown> {
  const options = request.providerOptions ?? {};
  const reserved = Object.keys(options).filter((key) => RESERVED.includes(key));
  if (reserved.length > 0) {
    throw new Error(
      `Use the judgment arguments instead of providerOptions for ${reserved.join(", ")}`
    );
  }

  return {
    model: request.model,
    state: request.input,
    questions: Object.fromEntries(request.questions.map((q) => [q.name, renderQuestion(q)])),
    ...options
  };
}

function malformed(detail: string): never {
  throw new Error(`System One returned an invalid judgment: ${detail}`);
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) malformed(`${field} is not a number`);
  return value;
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) malformed(`${field} is missing`);
  return value as Record<string, unknown>;
}

function parseAnswer(raw: unknown, question: NamedQuestion): JudgmentAnswerData {
  const answer = requireObject(raw, `the answer to '${question.name}'`);

  switch (question.type) {
    case "probability":
      return {
        type: "probability",
        probability: requireNumber(answer.noul, `${question.name}.noul`)
      };

    case "choice": {
      const options = Object.keys(question.options);
      const chosen = answer.choice;
      if (typeof chosen !== "string" || !options.includes(chosen)) {
        malformed(`'${question.name}' chose '${String(chosen)}', which is not one of its options`);
      }
      const wire = requireObject(answer.probabilities, `${question.name}.probabilities`);
      const probabilities = Object.fromEntries(
        options.map((option) => [
          option,
          requireNumber(wire[option], `${question.name}.probabilities.${option}`)
        ])
      );
      return {
        type: "choice",
        choice: chosen,
        probabilities,
        confidence: requireNumber(answer.confidence, `${question.name}.confidence`)
      };
    }

    case "score": {
      // Levels go out as an array and come back keyed "0", "1", ... - map them
      // back to numeric indexes so they line up with the declared levels.
      const wire = requireObject(answer.probabilities, `${question.name}.probabilities`);
      const probabilities: Record<number, number> = {};
      question.levels.forEach((_, index) => {
        probabilities[index] = requireNumber(
          wire[String(index)],
          `${question.name}.probabilities.${index}`
        );
      });
      return {
        type: "score",
        score: requireNumber(answer.score, `${question.name}.score`),
        probabilities,
        confidence: requireNumber(answer.confidence, `${question.name}.confidence`)
      };
    }
  }
}

export function parseJudgmentResponse(json: unknown, questions: NamedQuestion[]): JudgmentResponse {
  const body = requireObject(json, "the response body");
  const answers = requireObject(body.answers, "answers");
  const usage = (body.usage ?? {}) as { input_tokens?: number; output_tokens?: number };
  const input = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
  const output = typeof usage.output_tokens === "number" ? usage.output_tokens : 0;

  return {
    model: typeof body.model === "string" ? body.model : "",
    answers: Object.fromEntries(
      questions.map((question) => [question.name, parseAnswer(answers[question.name], question)])
    ),
    usage: { input_tokens: input, output_tokens: output, total_tokens: input + output },
    raw: json
  };
}

/**
 * Turns an error response into the matching NodeLLM error. System One reports
 * errors FastAPI-style: `detail` is a string, an object with a `message`, or a
 * list of validation errors each with a location and message.
 */
export async function handleTypeSafeError(response: Response, model?: string): Promise<never> {
  const status = response.status;
  let body: unknown;
  let message = `TypeSafe error (${status})`;

  try {
    body = await response.json();
    const detail = (body as { detail?: unknown })?.detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item: { loc?: unknown[]; msg?: string }) =>
          [Array.isArray(item.loc) ? item.loc.join(".") : "", item.msg ?? ""]
            .filter(Boolean)
            .join(": ")
        )
        .join("; ");
    } else if (detail && typeof detail === "object" && "message" in detail) {
      message = String((detail as { message: unknown }).message);
    }
  } catch {
    body = await response.text().catch(() => "");
  }

  const provider = "typesafe";
  if (status === 400 || status === 422) throw new BadRequestError(message, body, provider, model);
  if (status === 401 || status === 403)
    throw new AuthenticationError(message, status, body, provider);
  if (status === 404) {
    if (message.toLowerCase().includes("model"))
      throw new InvalidModelError(message, body, provider, model);
    throw new NotFoundError(message, status, body, provider, model);
  }
  if (status === 429) {
    const retryAfter = Number(response.headers?.get?.("retry-after"));
    throw new RateLimitError(
      message,
      body,
      provider,
      model,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined
    );
  }
  if (status === 503) throw new ServiceUnavailableError(message, status, body, provider);
  if (status >= 500) throw new ServerError(message, status, body, provider);
  throw new APIError(message, status, body, provider, model);
}
