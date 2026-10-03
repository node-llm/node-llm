/**
 * Judgments Verification
 *
 * Verifies typed judgments against the live TypeSafe System One API (Jev).
 * This is a checker, not a demo: it asserts on the answers and exits non-zero
 * if anything is off.
 *
 * Requires TYPESAFE_API_KEY (or JEV_API_KEY). Each call costs a fraction of a
 * cent.
 *
 *   node examples/scripts/core/judgments.mjs
 */

import { NodeLLM, Judge, probability, choice, score } from "../../../packages/core/dist/index.js";
import "dotenv/config";

const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const mark = passed ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  console.log(`  ${mark} ${name} — ${detail}`);
}

const sumOf = (values) => Object.values(values).reduce((a, b) => a + b, 0);

class TicketTriage extends Judge {
  static questions = {
    urgent: probability("Does the customer need action today?", {
      yes: "An explicit deadline today or an ongoing outage",
      no: "A routine request with no time pressure"
    }),
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
  };
}

async function verifyTriage() {
  console.log("\n--- A Judge class over contrasting tickets ---");

  const angry = await TicketTriage.judge(
    "This is the THIRD time I've been double charged. Refund it today or I'm cancelling."
  );
  const calm = await TicketTriage.judge(
    "Hi! Whenever you have a moment, could you resend last month's invoice? Thanks."
  );

  record("routes a refund to billing", angry.department.choice === "billing", `choice=${angry.department.choice}`);
  record(
    "rates the angry ticket more urgent than the calm one",
    angry.urgent.probability > calm.urgent.probability,
    `angry=${angry.urgent.probability} calm=${calm.urgent.probability}`
  );
  record(
    "scores the angry ticket more frustrated than the calm one",
    angry.frustration.score > calm.frustration.score,
    `angry=${angry.frustration.score} calm=${calm.frustration.score}`
  );
  record(
    "returns a full choice distribution summing to 1",
    Math.abs(sumOf(angry.department.probabilities) - 1) < 1e-6,
    JSON.stringify(angry.department.probabilities)
  );
  record(
    "keeps score levels and per-level probabilities",
    angry.frustration.levels.length === 3 && Object.keys(angry.frustration.probabilities).length === 3,
    JSON.stringify(angry.frustration.probabilities)
  );
  record(
    "reports the answering model and token usage",
    /^jev/.test(angry.model) && angry.usage.input_tokens > 0,
    `model=${angry.model} input=${angry.usage.input_tokens} output=${angry.usage.output_tokens}`
  );
}

async function verifyCost() {
  console.log("\n--- Cost ---");

  const judgment = await NodeLLM.judge("Please refund the duplicate charge.", {
    questions: { urgent: probability("Does this need attention today?") }
  });
  const expected = Number(((judgment.usage.input_tokens / 1_000_000) * 0.042).toFixed(6));
  record(
    "prices input at $0.042/MTok and output free",
    judgment.usage.input_cost === expected && judgment.usage.output_cost === 0,
    `input=${judgment.usage.input_tokens} tokens -> $${judgment.usage.input_cost}, output $${judgment.usage.output_cost}`
  );
}

async function verifyRouting() {
  console.log("\n--- Routing by model ---");

  // The global instance is usually scoped to a chat provider; jev-latest must
  // still be answered by TypeSafe.
  const judgment = await NodeLLM.judge("The production database is down.", {
    questions: { urgent: probability("Does this need attention today?") }
  });
  record(
    "NodeLLM.judge reaches TypeSafe from the default instance",
    /^jev/.test(judgment.model) && judgment.urgent.probability > 0.5,
    `model=${judgment.model} urgent=${judgment.urgent.probability}`
  );

  const preview = await NodeLLM.judge("Thanks, that fixed it!", {
    model: "jev-preview",
    questions: { satisfied: probability("Is the customer satisfied?") }
  });
  record(
    "answers with jev-preview when asked",
    preview.satisfied.probability > 0.5,
    `model=${preview.model} satisfied=${preview.satisfied.probability}`
  );
}

async function verifyErrors() {
  console.log("\n--- Errors ---");

  const fromServer = await NodeLLM.judge("hello", {
    model: "jev-does-not-exist",
    provider: "typesafe",
    questions: { q: probability("Is this a greeting?") }
  }).catch((e) => e);
  record(
    "the server's rejection of an unknown model arrives as a typed error",
    fromServer?.name === "BadRequestError" && fromServer?.provider === "typesafe",
    `${fromServer?.name}: ${fromServer?.message}`
  );

  // Without a provider, an unknown model cannot be routed; it must be refused
  // rather than sent somewhere the caller did not choose.
  const unroutable = await NodeLLM.judge("hello", {
    model: "jev-does-not-exist",
    questions: { q: probability("Is this a greeting?") }
  }).catch((e) => e);
  record(
    "an unroutable model is refused with a clear message",
    /Unknown judgment model/.test(unroutable?.message ?? ""),
    unroutable?.message
  );
}

async function main() {
  console.log("Judgments verification");
  console.log("======================");

  if (!process.env.TYPESAFE_API_KEY && !process.env.JEV_API_KEY) {
    console.log("\x1b[33mSet TYPESAFE_API_KEY (or JEV_API_KEY) to run this check.\x1b[0m");
    process.exit(1);
  }

  for (const step of [verifyTriage, verifyCost, verifyRouting, verifyErrors]) {
    try {
      await step();
    } catch (error) {
      record(`${step.name} raised`, false, error.message || String(error));
    }
  }

  console.log("\n======================");
  const failed = results.filter((r) => !r.passed);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.log("\n\x1b[31mFailed:\x1b[0m");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }

  console.log("\x1b[32mJudgments verified against the live API.\x1b[0m");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
