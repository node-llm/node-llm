import { describe, it, expect, afterEach } from "vitest";
import {
  createLLM,
  Judge,
  probability,
  choice,
  score,
  ProbabilityAnswer,
  ChoiceAnswer,
  ScoreAnswer,
  BadRequestError
} from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

/**
 * Recorded against the live System One API (api.typesafe.ai) with
 * `node scripts/vcr-record.mjs typesafe`; replays offline otherwise.
 */
describe("TypeSafe Judgments Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) await polly.stop();
  });

  const near = (value: number, target: number) => Math.abs(value - target) < 1e-6;
  const sum = (values: Record<string | number, number>) =>
    Object.values(values).reduce((a, b) => a + b, 0);

  it("answers probability, choice and score questions about text", async ({ task }) => {
    polly = setupVCR(task.name, "typesafe");
    const llm = createLLM({ provider: "typesafe" });

    const judgment = await llm.judge(
      "I was charged twice. Please refund the duplicate charge today.",
      {
        questions: {
          urgent: probability("Does the customer need action today?"),
          department: choice("Which team should handle this message?", {
            billing: "Payments and refunds",
            technical: "Bugs and integrations",
            other: null
          }),
          frustration: score("How frustrated is the customer?", [
            "Calm and polite",
            "Expresses frustration",
            "Angry or hostile"
          ])
        }
      }
    );

    expect(judgment.model).toMatch(/^jev/);
    expect(judgment.usage.input_tokens).toBeGreaterThan(0);
    expect(judgment.usage.total_tokens).toBe(
      judgment.usage.input_tokens + judgment.usage.output_tokens
    );
    // $0.042 per million input tokens; output is free.
    expect(judgment.usage.input_cost).toBeGreaterThan(0);
    expect(judgment.usage.output_cost).toBe(0);

    expect(judgment.urgent).toBeInstanceOf(ProbabilityAnswer);
    expect(judgment.urgent.probability).toBeGreaterThanOrEqual(0);
    expect(judgment.urgent.probability).toBeLessThanOrEqual(1);

    expect(judgment.department).toBeInstanceOf(ChoiceAnswer);
    expect(judgment.department.choice).toBe("billing");
    expect(Object.keys(judgment.department.probabilities).sort()).toEqual([
      "billing",
      "other",
      "technical"
    ]);
    expect(near(sum(judgment.department.probabilities), 1)).toBe(true);

    expect(judgment.frustration).toBeInstanceOf(ScoreAnswer);
    expect(judgment.frustration.score).toBeGreaterThanOrEqual(0);
    expect(judgment.frustration.score).toBeLessThanOrEqual(2);
    expect(Object.keys(judgment.frustration.probabilities)).toEqual(["0", "1", "2"]);
    expect(near(sum(judgment.frustration.probabilities), 1)).toBe(true);
  });

  it("routes the default judgment model to TypeSafe from an instance scoped elsewhere", async ({
    task
  }) => {
    polly = setupVCR(task.name, "typesafe");
    // Scoped to OpenAI, as most apps are; jev-latest still goes to TypeSafe.
    const llm = createLLM({ provider: "openai" });

    const judgment = await llm.judge(
      "The production database is down and customers cannot log in.",
      {
        questions: { urgent: probability("Does this need attention today?") }
      }
    );

    expect(judgment.model).toMatch(/^jev/);
    expect(judgment.urgent.probability).toBeGreaterThan(0.5);
  });

  it("judges structured input with yes/no criteria", async ({ task }) => {
    polly = setupVCR(task.name, "typesafe");
    const llm = createLLM({ provider: "typesafe" });

    const judgment = await llm.judge(
      {
        subject: "Invoice question",
        body: "Could you resend last month's invoice when you get a chance? No rush.",
        customer: { plan: "Pro", previous_contacts: 0 }
      },
      {
        questions: {
          urgent: probability("Does this need attention today?", {
            yes: "An explicit deadline today or an outage",
            no: "A routine request with no time pressure"
          })
        }
      }
    );

    expect(judgment.urgent.probability).toBeLessThan(0.5);
  });

  it("works through a Judge class with runtime inputs", async ({ task }) => {
    polly = setupVCR(task.name, "typesafe");

    class TeamRouter extends Judge {
      static inputs = ["teams"] as const;
      static questions = ({ teams }: { teams: Record<string, string> }) => ({
        team: choice("Which team should handle this ticket?", teams)
      });
    }

    const judgment = await TeamRouter.judge("My card was declined at checkout.", {
      llm: createLLM({ provider: "typesafe" }),
      inputs: {
        teams: {
          payments: "Card payments, refunds and invoices",
          accounts: "Logins, passwords and profile settings"
        }
      }
    });

    expect(judgment.team.choice).toBe("payments");
    expect(judgment.team.confidence).toBeGreaterThan(0);
  });

  it("answers with the preview model", async ({ task }) => {
    polly = setupVCR(task.name, "typesafe");
    const llm = createLLM({ provider: "typesafe" });

    const judgment = await llm.judge("Thanks, that fixed it!", {
      model: "jev-preview",
      questions: { satisfied: probability("Is the customer satisfied?") }
    });

    expect(judgment.model).toMatch(/^jev/);
    expect(judgment.satisfied.probability).toBeGreaterThan(0.5);
  });

  it("lists the judgment models", async ({ task }) => {
    polly = setupVCR(task.name, "typesafe");
    const llm = createLLM({ provider: "typesafe" });

    const models = await llm.listModels();
    const ids = models.map((m) => m.id);

    expect(ids).toContain("jev-latest");
    for (const model of models) {
      expect(model.provider).toBe("typesafe");
      expect(model.capabilities).toEqual(["judgment"]);
    }
  });

  it("raises a typed error for a model that does not exist", async ({ task }) => {
    // The error response itself is what this test checks, so record it.
    polly = setupVCR(task.name, "typesafe", { recordFailedRequests: true });
    const llm = createLLM({ provider: "typesafe" });

    const error = await llm
      .judge("hello", {
        model: "jev-does-not-exist",
        questions: { q: probability("Is this a greeting?") }
      })
      .catch((e) => e);

    // Recorded live: System One answers an unknown model with a 400.
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.provider).toBe("typesafe");
  });
});
