import { describe, it, expect, vi, beforeEach, afterEach, Mock, expectTypeOf } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { probability, choice, score } from "../../../src/judge/Question.js";
import { Judge, defineJudge } from "../../../src/judge/Judge.js";
import {
  Judgment,
  ProbabilityAnswer,
  ChoiceAnswer,
  ScoreAnswer
} from "../../../src/judge/Judgment.js";
import { UnsupportedFeatureError } from "../../../src/errors/index.js";

// Recorded from a live call to api.typesafe.ai/v1/systemone.
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

const QUESTIONS = {
  urgent: probability("Does the customer need action today?"),
  department: choice("Which team?", {
    billing: "Payments and refunds",
    technical: "Bugs",
    other: null
  }),
  frustration: score("How frustrated?", ["Calm", "Frustrated", "Angry"])
};

let requests: Array<{ url: string; body: any; headers: Record<string, string> }>;
let nextResponse: unknown;

/** Serves this body for the next request only, still recording the request. */
function respondOnce(body: unknown) {
  nextResponse = body;
}

beforeEach(() => {
  requests = [];
  nextResponse = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      requests.push({
        url,
        body: init.body ? JSON.parse(init.body as string) : undefined,
        headers: init.headers as Record<string, string>
      });
      const body = nextResponse ?? LIVE_RESPONSE;
      nextResponse = undefined;
      return new Response(JSON.stringify(body), { status: 200 });
    }) as Mock
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// An instance scoped to OpenAI, as most apps are, with a TypeSafe key available.
const llm = () => createLLM({ provider: "openai", openaiApiKey: "sk", typesafeApiKey: "ts-key" });

describe("NodeLLM.judge", () => {
  it("routes the default judgment model to TypeSafe whatever the instance's provider", async () => {
    await llm().judge("Refund me today", { questions: QUESTIONS });

    expect(requests).toHaveLength(1);
    expect(requests[0]!.url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(requests[0]!.headers.Authorization).toBe("Bearer ts-key");
    expect(requests[0]!.body.model).toBe("jev-latest");
    expect(requests[0]!.body.state).toBe("Refund me today");
  });

  it("returns typed answers", async () => {
    const judgment = await llm().judge("Refund me today", { questions: QUESTIONS });

    expect(judgment).toBeInstanceOf(Judgment);
    expect(judgment.urgent).toBeInstanceOf(ProbabilityAnswer);
    expect(judgment.urgent.probability).toBe(0.91);

    expect(judgment.department).toBeInstanceOf(ChoiceAnswer);
    expect(judgment.department.choice).toBe("billing");
    expect(judgment.department.probabilities.technical).toBe(0);
    expect(judgment.department.confidence).toBe(1);

    expect(judgment.frustration).toBeInstanceOf(ScoreAnswer);
    expect(judgment.frustration.score).toBe(0.83);
    expect(judgment.frustration.levels).toEqual(["Calm", "Frustrated", "Angry"]);
    expect(judgment.frustration.probabilities[1]).toBe(0.83);

    expectTypeOf(judgment.department.choice).toEqualTypeOf<"billing" | "technical" | "other">();
    expectTypeOf(judgment.urgent).toEqualTypeOf<ProbabilityAnswer>();
    expectTypeOf(judgment.frustration).toEqualTypeOf<ScoreAnswer>();
  });

  it("reports the answering model, usage and cost", async () => {
    const judgment = await llm().judge("x", { questions: QUESTIONS });

    expect(judgment.model).toBe("jev-1.13.0");
    expect(judgment.usage).toMatchObject({
      input_tokens: 382,
      output_tokens: 70,
      total_tokens: 452
    });
    // $0.042 per million input tokens, output free (TypeSafe's published rate).
    // Priced by the requested jev-latest even though the response names the
    // build that answered, which the registry does not list.
    expect(judgment.usage.input_cost).toBe(Number(((382 / 1_000_000) * 0.042).toFixed(6)));
    expect(judgment.usage.output_cost).toBe(0);
    expect(judgment.usage.cost).toBe(judgment.usage.input_cost);
  });

  it("leaves cost undefined for a model with no known pricing", async () => {
    const local = createLLM({
      provider: "typesafe",
      typesafeApiKey: "local",
      typesafeApiBase: "http://localhost:8001"
    });
    const judgment = await local.judge("x", { questions: QUESTIONS, model: "my-local-jev" });

    expect(judgment.usage.input_tokens).toBe(382);
    expect(judgment.usage.cost).toBeUndefined();
  });

  it("offers get, fetch, iteration and JSON", async () => {
    const judgment = await llm().judge("x", { questions: QUESTIONS });

    expect(judgment.get("urgent")?.probability).toBe(0.91);
    expect(judgment.get("missing" as any)).toBeUndefined();
    expect(() => judgment.fetch("missing" as any)).toThrow("No answer named 'missing'");
    expect([...judgment].map(([name]) => name)).toEqual(["urgent", "department", "frustration"]);
    expect(JSON.parse(JSON.stringify(judgment)).answers.urgent).toEqual({
      type: "probability",
      probability: 0.91
    });
  });

  it("returns frozen answers without freezing the caller's questions", async () => {
    const levels = ["Calm", "Frustrated", "Angry"];
    const judgment = await llm().judge("x", {
      questions: { ...QUESTIONS, frustration: score("How frustrated?", levels) }
    });

    expect(Object.isFrozen(judgment.frustration)).toBe(true);
    expect(Object.isFrozen(levels)).toBe(false);
  });

  it("keeps a question named like a Judgment member reachable through answers", async () => {
    respondOnce({ model: "jev-1.13.0", answers: { model: { noul: 0.4 } }, usage: {} });
    const judgment = await llm().judge("x", {
      questions: { model: probability("Is it a model?") }
    });

    expect(judgment.model).toBe("jev-1.13.0");
    expect(judgment.answers.model.probability).toBe(0.4);
  });

  it("sends structured input as-is", async () => {
    await llm().judge(
      { message: "Refund me", customer: { plan: "Pro" } },
      { questions: QUESTIONS }
    );
    expect(requests[0]!.body.state).toEqual({ message: "Refund me", customer: { plan: "Pro" } });
  });

  it("uses a model override and the instance default", async () => {
    await llm().judge("x", { questions: QUESTIONS, model: "jev-preview" });
    expect(requests[0]!.body.model).toBe("jev-preview");

    const withDefault = createLLM({
      provider: "openai",
      openaiApiKey: "sk",
      typesafeApiKey: "ts-key",
      defaultJudgmentModel: "jev-preview"
    });
    await withDefault.judge("x", { questions: QUESTIONS });
    expect(requests[1]!.body.model).toBe("jev-preview");
  });

  it("sends a model the registry does not know to the instance's own provider", async () => {
    // e.g. a Jev-compatible local server.
    const local = createLLM({
      provider: "typesafe",
      typesafeApiKey: "local",
      typesafeApiBase: "http://localhost:8001"
    });
    await local.judge("x", { questions: QUESTIONS, model: "my-local-jev" });

    expect(requests[0]!.url).toBe("http://localhost:8001/v1/systemone");
    expect(requests[0]!.body.model).toBe("my-local-jev");
  });

  it("keeps a scoped instance's settings for the model's own provider", async () => {
    const scoped = createLLM({
      provider: "typesafe",
      typesafeApiKey: "scoped",
      typesafeApiBase: "http://localhost:9000/"
    });
    await scoped.judge("x", { questions: QUESTIONS });

    expect(requests[0]!.url).toBe("http://localhost:9000/v1/systemone");
    expect(requests[0]!.headers.Authorization).toBe("Bearer scoped");
  });

  it("refuses to guess a provider for an unknown model", async () => {
    const unscoped = createLLM({ typesafeApiKey: "ts-key" });

    await expect(
      unscoped.judge("x", { questions: QUESTIONS, model: "jev-does-not-exist" })
    ).rejects.toThrow(/Unknown judgment model 'jev-does-not-exist'.*provider/);
    expect(requests).toHaveLength(0);

    // Naming the provider is enough to reach it.
    await unscoped.judge("x", { questions: QUESTIONS, model: "jev-new", provider: "typesafe" });
    expect(requests[0]!.body.model).toBe("jev-new");
  });

  it("says clearly when the chosen provider cannot judge", async () => {
    await expect(
      llm().judge("x", { questions: QUESTIONS, model: "gpt-4.1", provider: "openai" })
    ).rejects.toBeInstanceOf(UnsupportedFeatureError);
    expect(requests).toHaveLength(0);
  });

  it("validates before sending anything", async () => {
    await expect(llm().judge(undefined as any, { questions: QUESTIONS })).rejects.toThrow(
      "Judgment input must be"
    );
    await expect(llm().judge("x", { questions: {} })).rejects.toThrow("at least one question");
    expect(requests).toHaveLength(0);
  });

  it("runs middlewares around the request", async () => {
    const seen: string[] = [];
    const middleware = {
      name: "spy",
      onRequest: async (ctx: any) => {
        seen.push(`request:${ctx.provider}:${ctx.model}`);
        ctx.judgmentInput = "rewritten by middleware";
      },
      onResponse: async (_ctx: any, result: any) => {
        seen.push(`response:${result.urgent.probability}`);
      }
    };

    await llm().judge("original", { questions: QUESTIONS, middlewares: [middleware] });

    expect(seen).toEqual(["request:typesafe:jev-latest", "response:0.91"]);
    expect(requests[0]!.body.state).toBe("rewritten by middleware");
  });
});

describe("Judge", () => {
  class TicketTriage extends Judge {
    static questions = QUESTIONS;
  }

  it("judges with the declared questions and types the answers", async () => {
    const judgment = await TicketTriage.judge("Refund me today", { llm: llm() });

    expect(judgment.department.choice).toBe("billing");
    expectTypeOf(judgment.department.choice).toEqualTypeOf<"billing" | "technical" | "other">();
    expect(Object.keys(requests[0]!.body.questions)).toEqual([
      "urgent",
      "department",
      "frustration"
    ]);
  });

  it("honours a declared model and a per-call override", async () => {
    class Preview extends Judge {
      static model = "jev-preview";
      static questions = QUESTIONS;
    }
    await Preview.judge("x", { llm: llm() });
    await Preview.judge("x", { llm: llm(), model: "jev-latest" });

    expect(requests.map((r) => r.body.model)).toEqual(["jev-preview", "jev-latest"]);
  });

  it("builds questions and input from declared inputs", async () => {
    class TeamRouter extends Judge {
      static inputs = ["teams"] as const;
      static questions = ({ teams }: { teams: Array<{ slug: string; about: string }> }) => ({
        team: choice(
          "Which team should handle this?",
          Object.fromEntries(teams.map((t) => [t.slug, t.about]))
        )
      });
    }

    respondOnce({
      model: "jev-1.13.0",
      answers: {
        team: { choice: "payments", confidence: 0.9, probabilities: { payments: 0.9, bugs: 0.1 } }
      },
      usage: {}
    });

    const judgment = await TeamRouter.judge("Refund me", {
      llm: llm(),
      inputs: {
        teams: [
          { slug: "payments", about: "Charges and refunds" },
          { slug: "bugs", about: "Defects" }
        ]
      }
    });

    expect(requests[0]!.body.questions.team.criteria).toEqual({
      payments: "Charges and refunds",
      bugs: "Defects"
    });
    expect(judgment.team.choice).toBe("payments");
  });

  it("requires exactly the declared inputs", async () => {
    class NeedsTeams extends Judge {
      static inputs = ["teams"] as const;
      static questions = { urgent: probability("Urgent?") };
    }

    await expect(NeedsTeams.judge("x", { llm: llm() })).rejects.toThrow("missing inputs: teams");
    await expect(
      NeedsTeams.judge("x", { llm: llm(), inputs: { teams: [], extra: 1 } })
    ).rejects.toThrow("does not declare inputs: extra");
    expect(requests).toHaveLength(0);
  });

  it("merges declared and per-call provider options", async () => {
    class WithOptions extends Judge {
      static questions = QUESTIONS;
      static providerOptions = { a: 1, b: 1 };
    }
    await WithOptions.judge("x", { llm: llm(), providerOptions: { b: 2 } });

    expect(requests[0]!.body).toMatchObject({ a: 1, b: 2 });
  });
});

describe("defineJudge", () => {
  it("defines a judge without a class", async () => {
    const Urgency = defineJudge({
      questions: { urgent: probability("Does this need attention today?") }
    });

    respondOnce({ model: "jev-1.13.0", answers: { urgent: { noul: 0.7 } }, usage: {} });
    const judgment = await Urgency.judge("The site is down", { llm: llm() });

    expect(judgment.urgent.probability).toBe(0.7);
    expectTypeOf(judgment.urgent).toEqualTypeOf<ProbabilityAnswer>();
  });
});

describe("TypeSafe provider", () => {
  it("refuses chat with a clear error", async () => {
    const typesafe = createLLM({ provider: "typesafe", typesafeApiKey: "k" });
    await expect(typesafe.chat("jev-latest").ask("hello")).rejects.toThrow(/typesafe.*chat/i);
  });
});
