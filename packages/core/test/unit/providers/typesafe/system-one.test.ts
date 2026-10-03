import { describe, it, expect } from "vitest";
import {
  renderJudgmentPayload,
  parseJudgmentResponse,
  handleTypeSafeError
} from "../../../../src/providers/typesafe/SystemOne.js";
import { normalizeQuestions, probability, choice, score } from "../../../../src/judge/Question.js";
import {
  AuthenticationError,
  BadRequestError,
  RateLimitError,
  ServerError
} from "../../../../src/errors/index.js";

const questions = normalizeQuestions({
  urgent: probability("Does the customer need action today?"),
  department: choice("Which team?", {
    billing: "Payments and refunds",
    technical: "Bugs",
    other: null
  }),
  frustration: score("How frustrated?", ["Calm", "Frustrated", "Angry"])
});

// Recorded from a live call to api.typesafe.ai/v1/systemone with these questions.
const LIVE_RESPONSE = {
  model: "jev-1.13.0",
  answers: {
    urgent: { type: "noul", noul: 0.91 },
    department: {
      type: "choice",
      choice: "billing",
      confidence: 1.0,
      probabilities: { billing: 1.0, other: 0.0, technical: 0.0 }
    },
    frustration: {
      type: "score",
      score: 0.83,
      confidence: 0.74,
      legend: { "0": "Calm", "1": "Frustrated", "2": "Angry" },
      probabilities: { "0": 0.17, "1": 0.83, "2": 0.0 }
    }
  },
  usage: { input_tokens: 382, output_tokens: 70 }
};

describe("renderJudgmentPayload", () => {
  it("renders the request System One expects", () => {
    expect(
      renderJudgmentPayload({ model: "jev-latest", input: { message: "Refund me" }, questions })
    ).toEqual({
      model: "jev-latest",
      state: { message: "Refund me" },
      questions: {
        urgent: { type: "noul", instructions: "Does the customer need action today?" },
        department: {
          type: "choice",
          instructions: "Which team?",
          criteria: { billing: "Payments and refunds", technical: "Bugs", other: null }
        },
        frustration: {
          type: "score",
          instructions: "How frustrated?",
          criteria: ["Calm", "Frustrated", "Angry"]
        }
      }
    });
  });

  it("sends yes/no descriptions under System One's true/false keys", () => {
    const [urgent] = normalizeQuestions({
      urgent: probability("Urgent?", { yes: "Deadline today", no: "No deadline" })
    });
    const body = renderJudgmentPayload({
      model: "jev-latest",
      input: "x",
      questions: [urgent!]
    }) as any;

    expect(body.questions.urgent.criteria).toEqual({
      true: "Deadline today",
      false: "No deadline"
    });
  });

  it("omits instructions that were not given", () => {
    const named = normalizeQuestions({ team: choice(undefined, { a: "A", b: "B" }) });
    const body = renderJudgmentPayload({
      model: "jev-latest",
      input: "x",
      questions: named
    }) as any;

    expect(body.questions.team).not.toHaveProperty("instructions");
  });

  it("merges provider options into the body", () => {
    const body = renderJudgmentPayload({
      model: "jev-latest",
      input: "x",
      questions,
      providerOptions: { temperature_hint: 0.1 }
    });
    expect(body).toHaveProperty("temperature_hint", 0.1);
  });

  it("refuses provider options that would overwrite the request", () => {
    for (const key of ["model", "state", "questions"]) {
      expect(() =>
        renderJudgmentPayload({
          model: "jev-latest",
          input: "x",
          questions,
          providerOptions: { [key]: 1 }
        })
      ).toThrow(`instead of providerOptions for ${key}`);
    }
  });
});

describe("parseJudgmentResponse", () => {
  const parsed = parseJudgmentResponse(LIVE_RESPONSE, questions);

  it("reports the model that actually answered", () => {
    expect(parsed.model).toBe("jev-1.13.0");
  });

  it("maps noul to a probability", () => {
    expect(parsed.answers.urgent).toEqual({ type: "probability", probability: 0.91 });
  });

  it("maps a choice with its full distribution", () => {
    expect(parsed.answers.department).toEqual({
      type: "choice",
      choice: "billing",
      probabilities: { billing: 1.0, technical: 0.0, other: 0.0 },
      confidence: 1.0
    });
  });

  it("maps score probabilities back to numeric level indexes", () => {
    expect(parsed.answers.frustration).toEqual({
      type: "score",
      score: 0.83,
      probabilities: { 0: 0.17, 1: 0.83, 2: 0.0 },
      confidence: 0.74
    });
  });

  it("reports token usage", () => {
    expect(parsed.usage).toEqual({ input_tokens: 382, output_tokens: 70, total_tokens: 452 });
  });

  it("tolerates a missing usage block", () => {
    const { usage: _usage, ...noUsage } = LIVE_RESPONSE;
    expect(parseJudgmentResponse(noUsage, questions).usage.total_tokens).toBe(0);
  });

  it("rejects an answer that is missing", () => {
    const broken = { ...LIVE_RESPONSE, answers: { ...LIVE_RESPONSE.answers, urgent: undefined } };
    expect(() => parseJudgmentResponse(broken, questions)).toThrow(
      "System One returned an invalid judgment"
    );
  });

  it("rejects a choice outside the declared options", () => {
    const broken = {
      ...LIVE_RESPONSE,
      answers: {
        ...LIVE_RESPONSE.answers,
        department: { ...LIVE_RESPONSE.answers.department, choice: "sales" }
      }
    };
    expect(() => parseJudgmentResponse(broken, questions)).toThrow("not one of its options");
  });

  it("rejects a non-numeric probability", () => {
    const broken = {
      ...LIVE_RESPONSE,
      answers: { ...LIVE_RESPONSE.answers, urgent: { noul: "high" } }
    };
    expect(() => parseJudgmentResponse(broken, questions)).toThrow("is not a number");
  });
});

describe("handleTypeSafeError", () => {
  function response(status: number, body: unknown, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), { status, headers });
  }

  // Both bodies recorded from live calls.
  it("reads a detail object's message (bad request)", async () => {
    const err = await handleTypeSafeError(
      response(400, { detail: { error_type: "api_usage_error", message: "Invalid request." } })
    ).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.message).toBe("Invalid request.");
  });

  it("maps 401 to an authentication error", async () => {
    const err = await handleTypeSafeError(
      response(401, {
        detail: {
          error_type: "authentication_error",
          message: "Cannot authenticate with the server. Please check your API key and try again."
        }
      })
    ).catch((e) => e);
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.message).toContain("check your API key");
  });

  it("reads a plain string detail", async () => {
    const err = await handleTypeSafeError(response(500, { detail: "Boom" })).catch((e) => e);
    expect(err).toBeInstanceOf(ServerError);
    expect(err.message).toBe("Boom");
  });

  it("joins FastAPI validation errors with their locations", async () => {
    const err = await handleTypeSafeError(
      response(422, {
        detail: [
          { loc: ["body", "questions", "q", "type"], msg: "invalid type" },
          { loc: ["body", "state"], msg: "field required" }
        ]
      })
    ).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestError);
    expect(err.message).toBe("body.questions.q.type: invalid type; body.state: field required");
  });

  it("carries Retry-After on a rate limit", async () => {
    const err = await handleTypeSafeError(
      response(429, { detail: "Slow down" }, { "retry-after": "12" })
    ).catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(12);
  });
});
