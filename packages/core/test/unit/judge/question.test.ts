import { describe, it, expect } from "vitest";
import {
  probability,
  choice,
  score,
  normalizeQuestions,
  isJudgmentInput
} from "../../../src/judge/Question.js";

describe("question builders", () => {
  it("build plain definitions", () => {
    expect(probability("Urgent?")).toEqual({ type: "probability", instructions: "Urgent?" });
    expect(probability("Urgent?", { yes: "Today", no: "Later" })).toEqual({
      type: "probability",
      instructions: "Urgent?",
      criteria: { yes: "Today", no: "Later" }
    });
    expect(choice("Team?", { billing: "Payments", other: null })).toEqual({
      type: "choice",
      instructions: "Team?",
      options: { billing: "Payments", other: null }
    });
    expect(score("Mood?", ["Calm", "Angry"])).toEqual({
      type: "score",
      instructions: "Mood?",
      levels: ["Calm", "Angry"]
    });
  });
});

describe("normalizeQuestions", () => {
  it("keeps declaration order and attaches names", () => {
    const named = normalizeQuestions({
      b: probability("B?"),
      a: score("A?", ["low", "high"])
    });
    expect(named.map((q) => q.name)).toEqual(["b", "a"]);
  });

  it("does not modify the caller's definitions", () => {
    const questions = { urgent: probability("Urgent?") };
    normalizeQuestions(questions);
    expect(questions.urgent).not.toHaveProperty("name");
  });

  it("requires at least one question", () => {
    expect(() => normalizeQuestions({})).toThrow("at least one question");
  });

  it("rejects an unknown type", () => {
    expect(() => normalizeQuestions({ q: { type: "maybe" } as any })).toThrow(
      "unknown type 'maybe'"
    );
  });

  it("rejects probability criteria other than yes and no", () => {
    expect(() => normalizeQuestions({ q: probability("Q?", { maybe: "x" } as any) })).toThrow(
      "must describe yes and no"
    );
  });

  it("accepts true/false as aliases for yes/no", () => {
    expect(() =>
      normalizeQuestions({ q: { type: "probability", criteria: { true: "x", false: "y" } } as any })
    ).not.toThrow();
  });

  it("rejects describing the same outcome twice", () => {
    expect(() =>
      normalizeQuestions({ q: { type: "probability", criteria: { yes: "a", true: "b" } } as any })
    ).toThrow("duplicate outcomes");
  });

  it("rejects an empty choice", () => {
    expect(() => normalizeQuestions({ q: choice("Q?", {}) })).toThrow(
      "non-empty object of options"
    );
  });

  it("rejects an empty score", () => {
    expect(() => normalizeQuestions({ q: score("Q?", []) })).toThrow("non-empty array of levels");
  });

  it("rejects a description that is not JSON-compatible", () => {
    expect(() => normalizeQuestions({ q: choice("Q?", { a: new Date() as any }) })).toThrow(
      "descriptions must be"
    );
  });

  it("accepts structured descriptions and null", () => {
    expect(() =>
      normalizeQuestions({
        team: choice({ task: "Route", strict: true } as any, {
          billing: { handles: ["Charges", "Refunds"] },
          other: null
        })
      })
    ).not.toThrow();
  });

  it("rejects fields that belong to another question type", () => {
    expect(() =>
      normalizeQuestions({ q: { type: "score", levels: ["a"], options: { x: null } } as any })
    ).toThrow("unknown fields options");
  });
});

describe("isJudgmentInput", () => {
  it("accepts text, objects and arrays of JSON values", () => {
    expect(isJudgmentInput("hello")).toBe(true);
    expect(isJudgmentInput({ message: "hi", tags: ["a"], n: 1 })).toBe(true);
    expect(isJudgmentInput([{ role: "user", content: "hi" }])).toBe(true);
  });

  it("rejects values that do not serialise faithfully", () => {
    expect(isJudgmentInput(undefined)).toBe(false);
    expect(isJudgmentInput(42)).toBe(false);
    expect(isJudgmentInput(new Date())).toBe(false);
    expect(isJudgmentInput({ when: new Date() })).toBe(false);
    expect(isJudgmentInput({ n: Number.NaN })).toBe(false);
  });
});
