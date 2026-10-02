---
layout: default
title: Judgments
parent: Core Features
nav_order: 11
description: Ask typed questions about your application data and get back probabilities, choices, and scores instead of text.
---

# {{ page.title }}
{: .no_toc }

{{ page.description }}
{: .fs-6 .fw-300 }

**Added in v1.18.0**
{: .label .label-green }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Use a judgment when your code needs to **branch on a decision** — is this urgent, which team owns it, how upset is the customer — rather than read prose. You define typed questions; the model returns a typed answer for each, with calibrated probabilities your code can threshold.

Judgments are answered by TypeSafe's **Jev** models through the System One API. They do not generate text, and each call judges only the input you give it — no conversation history is kept.

---

## A first judgment

```ts
import { NodeLLM, probability } from "@node-llm/core";

const judgment = await NodeLLM.judge("Please refund the duplicate charge today.", {
  questions: {
    urgent: probability("Does this need attention today?")
  }
});

judgment.urgent.probability; // 0.91
```

Set `TYPESAFE_API_KEY` (or `JEV_API_KEY`) first. The model defaults to `jev-latest`, and judgments are routed to TypeSafe by the model — so this works from any `NodeLLM` instance, whichever chat provider it is scoped to.

---

## Three kinds of question

```ts
import { NodeLLM, probability, choice, score } from "@node-llm/core";

const judgment = await NodeLLM.judge(ticket.body, {
  questions: {
    urgent: probability("Does this need attention today?"),

    department: choice("Which team should handle this?", {
      billing: "Payments and refunds",
      technical: "Bugs and integrations",
      other: null
    }),

    frustration: score("How frustrated is the customer?", ["Calm", "Frustrated", "Angry"])
  }
});
```

All questions are answered in one request, over the same input. Put the whole meaning in the question and its descriptions — the model never sees the question *name* (`urgent`), only the text.

### Probability

`probability` asks whether a statement holds. The answer is the probability of **yes**, from 0 to 1. Describe the boundary when it matters:

```ts
probability("Does this need attention today?", {
  yes: "An explicit deadline today or an ongoing outage",
  no: "A general question with no time pressure"
});
```

Either side is optional. A value near **0.5 means yes and no are about equally likely** — not "medium urgency". To measure degree, use a score.

### Choice

`choice` picks one option and returns a probability for **every** option. Include a catch-all such as `other` when none of the specific options may fit, and use `null` for an option that needs no description. When several conditions can hold at once, ask a separate probability question for each instead.

### Score

`score` places the input on an ordered scale. The first level is `0`, the next `1`, and so on; the answer is probability-weighted, so with three levels it runs from `0` to `2` and can fall between levels (`0.83` is "mostly Frustrated, a little Calm"). Describe each level concretely.

---

## Reading the answers

Answers are typed from your questions — including a choice's options:

```ts
judgment.urgent.probability;          // number

judgment.department.choice;           // "billing" | "technical" | "other"
judgment.department.probabilities;    // { billing: 1, technical: 0, other: 0 }
judgment.department.confidence;       // number

judgment.frustration.score;           // number, 0 to 2
judgment.frustration.levels;          // ["Calm", "Frustrated", "Angry"]
judgment.frustration.probabilities;   // { 0: 0.17, 1: 0.83, 2: 0 }
judgment.frustration.confidence;      // number
```

`confidence` describes how concentrated a choice or score distribution is. It is **not** a guarantee the answer is right, and probability answers have none. Choose your thresholds in application code and check them against representative data:

```ts
if (judgment.urgent.probability >= 0.8) {
  await ticket.update({ priority: "high" });
}
```

Answers are also on `judgment.answers`, through `judgment.get(name)` (undefined when missing) and `judgment.fetch(name)` (throws when missing), and by iterating the judgment. A question named like one of Judgment's own members — `model`, `usage`, `get` — is only reachable through `answers` or `get`.

---

## Supplying input

Pass text, or JSON-compatible structured data:

```ts
await NodeLLM.judge(
  {
    message: "I was charged twice.",
    customer: { plan: "Pro", previous_contacts: 2 }
  },
  { questions }
);
```

An array is **one** input (for example a list of messages), not several requests. Values that would not serialise faithfully — `Date`, `undefined`, `NaN`, class instances — are rejected; convert them first.

---

## Reusable judges

Declare questions once on a `Judge` class:

```ts
import { Judge, probability, choice } from "@node-llm/core";

class TicketTriage extends Judge {
  static questions = {
    urgent: probability("Does this need attention today?"),
    department: choice("Which team should handle this?", {
      billing: "Payments and refunds",
      technical: "Bugs and integrations",
      other: null
    })
  };
}

const judgment = await TicketTriage.judge(ticket.body);
judgment.department.choice; // "billing" | "technical" | "other"
```

Or without a class:

```ts
const Urgency = defineJudge({
  questions: { urgent: probability("Does this need attention today?") }
});
```

A judge can also set `model`, `provider`, and `providerOptions`.

### Questions from runtime data

Declare the inputs a judge needs; `questions`, `model`, and `providerOptions` can then be functions of them. They are resolved once per judgment.

```ts
class TeamRouter extends Judge {
  static inputs = ["teams"] as const;
  static questions = ({ teams }: { teams: Team[] }) => ({
    team: choice(
      "Which team should handle this ticket?",
      Object.fromEntries(teams.map((t) => [t.slug, t.description]))
    )
  });
}

await TeamRouter.judge(ticket.body, { inputs: { teams: await Team.active() } });
```

Declared inputs are required, and undeclared ones are rejected. Inputs are not sent to the model unless you put them in the input or a question.

---

## Choosing a model and provider

```ts
const llm = createLLM({ defaultJudgmentModel: "jev-preview" });   // instance default
await NodeLLM.judge(input, { questions, model: "jev-preview" });  // per call
class Strict extends Judge { static model = "jev-preview"; ... }  // per judge
```

| Model | |
|:--|:--|
| `jev-latest` | The default. TypeSafe's current System One model |
| `jev-preview` | A preview of the next `jev-latest` |

Routing follows the model: known Jev models always go to TypeSafe. For a model the registry does not know, name the provider, or call `judge` on an instance scoped to it — NodeLLM will not guess where to send it:

```ts
await NodeLLM.judge(input, { questions, model: "jev-new", provider: "typesafe" });
```

### A Jev-compatible local server

Any server implementing the System One API works. Point `typesafeApiBase` at it:

```ts
const local = NodeLLM.withProvider("typesafe", {
  typesafeApiBase: "http://localhost:8001",
  typesafeApiKey: "local"
});

await local.judge(input, { questions, model: "my-local-jev" });
```

---

## Usage and cost

```ts
judgment.model;               // the model that answered, e.g. "jev-1.13.0"
judgment.usage.input_tokens;
judgment.usage.output_tokens;
judgment.usage.input_cost;    // $0.042 per million input tokens
judgment.usage.output_cost;   // 0 - output is free
judgment.usage.cost;
```

Jev is priced at **$0.042 per million input tokens, with output free**. Cost is calculated from the model you asked for, so `jev-latest` is priced even though `judgment.model` names the exact build that answered. A model with no known pricing — such as one on a local server — leaves `cost` undefined rather than a guessed number.

Pass `providerOptions` to add provider-specific fields to the request. The fields NodeLLM builds itself (`model`, `state`, `questions`) are rejected there; use the regular arguments. Middlewares run around judgments as they do around other operations, with the input on `context.judgmentInput`.

---

## Testing judges

`@node-llm/testing` records and mocks judgments like any other call:

```ts
import { mockLLM } from "@node-llm/testing";

const mocker = mockLLM({ strict: true });
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
```

To check against the live API, run:

```bash
node examples/scripts/core/judgments.mjs
```

It asserts on real answers — billing routing, contrasting urgency and frustration, routing by model, and typed errors — and exits non-zero on any failure.

---

## Not supported yet

- **Images.** System One judges text and structured data only.

- **Retries.** Like `embed` and `moderate`, a judgment is sent once; failures surface as typed errors.
- **PII masking.** `PIIMaskMiddleware` masks chat messages; it does not yet mask `context.judgmentInput`.
