import { describe, it, expect, afterEach } from "vitest";
import { createLLM, probability, choice } from "@node-llm/core";
import { mockLLM, Mocker } from "../../src/Mocker.js";

const questions = {
  urgent: probability("Does this need attention today?"),
  department: choice("Which team?", { billing: "Payments", technical: "Bugs", other: null })
};

describe("Mocker: judgments", () => {
  let mocker: Mocker;

  afterEach(() => mocker.clear());

  it("serves a mocked judgment through NodeLLM.judge, as documented", async () => {
    mocker = mockLLM({ strict: true });
    mocker.judge(/refund/).respond({
      answers: {
        urgent: { type: "probability", probability: 0.9 },
        department: {
          type: "choice",
          choice: "billing",
          probabilities: { billing: 0.9, technical: 0.05, other: 0.05 },
          confidence: 0.85
        }
      }
    });

    const llm = createLLM({ provider: "openai", openaiApiKey: "sk", typesafeApiKey: "ts" });
    const judgment = await llm.judge("Please refund me", { questions });

    expect(judgment.urgent.probability).toBe(0.9);
    expect(judgment.department.choice).toBe("billing");
    expect(judgment.model).toBe("mock-judge");
    expect(mocker.getCalls("judge")).toHaveLength(1);
    expect(mocker.getLastCall("judge")?.prompt).toBe("Please refund me");
  });

  it("matches structured input as JSON", async () => {
    mocker = mockLLM({ strict: true });
    mocker
      .judge(/"plan":"Pro"/)
      .respond({ answers: { urgent: { type: "probability", probability: 0.2 } } });

    const llm = createLLM({ provider: "typesafe", typesafeApiKey: "ts" });
    const judgment = await llm.judge({ plan: "Pro" }, { questions: { urgent: questions.urgent } });

    expect(judgment.urgent.probability).toBe(0.2);
  });

  it("fails closed in strict mode when a judgment is not mocked", async () => {
    mocker = mockLLM({ strict: true });
    const llm = createLLM({ provider: "typesafe", typesafeApiKey: "ts" });

    await expect(llm.judge("anything", { questions })).rejects.toThrow(
      "Mocker: Unexpected LLM call to 'judge'"
    );
  });
});
