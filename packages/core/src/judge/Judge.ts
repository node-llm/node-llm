import { NodeLLM, NodeLLMCore } from "../llm.js";
import { JudgmentInput } from "../providers/Provider.js";
import { LazyValue } from "../agent/Agent.js";
import { QuestionMap } from "./Question.js";
import { JudgmentResult } from "./Judgment.js";

/** The questions a Judge class declares, once resolved. */
export type QuestionsOf<T> = T extends { questions: infer Q }
  ? Q extends (...args: never[]) => infer R
    ? R extends QuestionMap
      ? R
      : never
    : Q extends QuestionMap
      ? Q
      : never
  : never;

export interface JudgeCallOptions<I = Record<string, unknown>> {
  /** Values for the inputs the judge declares; available to lazy settings. */
  inputs?: I;
  /** Overrides the judge's model for this call. */
  model?: string;
  /** Overrides the judge's provider for this call. */
  provider?: string;
  /** Merged over the judge's own providerOptions. */
  providerOptions?: Record<string, unknown>;
  requestTimeout?: number;
  /** The NodeLLM instance to judge with. Defaults to the global NodeLLM. */
  llm?: NodeLLMCore;
}

/**
 * A reusable set of typed questions about your application data.
 *
 * Subclass it and declare `questions`; call `judge` with the input. Answers are
 * typed from the declaration, so a choice's answer is a union of its options.
 *
 * @example
 * class TicketTriage extends Judge {
 *   static questions = {
 *     urgent: probability("Does this need attention today?"),
 *     department: choice("Which team should handle this?", {
 *       billing: "Payments and refunds",
 *       technical: "Bugs and integrations",
 *       other: null
 *     }),
 *     frustration: score("How frustrated is the customer?", ["Calm", "Frustrated", "Angry"])
 *   };
 * }
 *
 * const judgment = await TicketTriage.judge("Please refund the duplicate charge today.");
 * judgment.urgent.probability;  // number
 * judgment.department.choice;   // "billing" | "technical" | "other"
 *
 * Settings can depend on runtime data. Declare the inputs a judge needs and
 * pass them to `judge`; `questions`, `model` and `providerOptions` may be
 * functions of those inputs, resolved once per judgment.
 *
 * @example
 * class TeamRouter extends Judge {
 *   static inputs = ["teams"] as const;
 *   static questions = ({ teams }: { teams: Team[] }) => ({
 *     team: choice("Which team should handle this?",
 *       Object.fromEntries(teams.map((t) => [t.slug, t.description])))
 *   });
 * }
 * await TeamRouter.judge(ticket.body, { inputs: { teams } });
 */
export abstract class Judge {
  /** The judgment model. Defaults to the instance default, then `jev-latest`. */
  static model?: LazyValue<string, never>;
  /** Routes to a specific provider; normally inferred from the model. */
  static provider?: string;
  /** Names of the inputs `judge` must be given. */
  static inputs?: readonly string[];
  /** The questions, or a function of the declared inputs returning them. */
  static questions: LazyValue<QuestionMap, never>;
  /** Provider-specific request fields, or a function of the inputs. */
  static providerOptions?: LazyValue<Record<string, unknown>, never>;

  /**
   * Judges the input and returns typed answers. The input is text, an object,
   * or an array of JSON-compatible values - or a function of the inputs that
   * returns one.
   */
  static async judge<
    T extends typeof Judge,
    I extends Record<string, unknown> = Record<string, unknown>
  >(
    this: T,
    input: LazyValue<JudgmentInput, I>,
    options: JudgeCallOptions<I> = {}
  ): Promise<JudgmentResult<QuestionsOf<T>>> {
    const inputs = (options.inputs ?? {}) as I;
    checkInputs(this, inputs);

    const resolve = <V>(value: LazyValue<V, I> | undefined): V | undefined =>
      typeof value === "function" ? (value as (inputs: I) => V)(inputs) : value;

    const questions = resolve(this.questions as LazyValue<QuestionMap, I>);
    if (!questions) {
      throw new Error(`${this.name} declares no questions`);
    }

    const declaredOptions = resolve(this.providerOptions as LazyValue<Record<string, unknown>, I>);
    const providerOptions =
      declaredOptions || options.providerOptions
        ? { ...declaredOptions, ...options.providerOptions }
        : undefined;

    const llm = options.llm ?? NodeLLM;
    return llm.judge(resolve(input) as JudgmentInput, {
      questions: questions as QuestionsOf<T>,
      model: options.model ?? resolve(this.model as LazyValue<string, I>),
      provider: options.provider ?? this.provider,
      providerOptions,
      requestTimeout: options.requestTimeout
    });
  }
}

function checkInputs(judge: typeof Judge, inputs: Record<string, unknown>): void {
  const declared = judge.inputs ?? [];
  const given = Object.keys(inputs);
  const missing = declared.filter((name) => !(name in inputs));
  const unknown = given.filter((name) => !declared.includes(name));
  if (missing.length > 0) throw new Error(`${judge.name} is missing inputs: ${missing.join(", ")}`);
  if (unknown.length > 0)
    throw new Error(`${judge.name} does not declare inputs: ${unknown.join(", ")}`);
}

/**
 * Defines a judge without a class, mirroring `defineAgent`.
 *
 * @example
 * const Urgency = defineJudge({
 *   questions: { urgent: probability("Does this need attention today?") }
 * });
 * (await Urgency.judge("The site is down")).urgent.probability;
 */
export function defineJudge<const Q extends QuestionMap>(definition: {
  questions: LazyValue<Q, never>;
  model?: LazyValue<string, never>;
  provider?: string;
  inputs?: readonly string[];
  providerOptions?: LazyValue<Record<string, unknown>, never>;
}) {
  return class extends Judge {
    static override questions = definition.questions;
    static override model = definition.model;
    static override provider = definition.provider;
    static override inputs = definition.inputs;
    static override providerOptions = definition.providerOptions;
  };
}
