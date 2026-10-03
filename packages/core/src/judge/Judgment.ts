import { JudgmentResponse, Usage } from "../providers/Provider.js";
import {
  ChoiceQuestion,
  Description,
  ProbabilityQuestion,
  NamedQuestion,
  QuestionDefinition,
  QuestionMap,
  ScoreQuestion
} from "./Question.js";

/** The probability that a yes/no statement holds, between 0 and 1. */
export class ProbabilityAnswer {
  readonly type = "probability" as const;

  constructor(readonly probability: number) {
    Object.freeze(this);
  }

  toJSON() {
    return { type: this.type, probability: this.probability };
  }
}

/**
 * The selected option, with a probability for every option. `confidence`
 * describes how concentrated the distribution is; it is not a guarantee that
 * the choice is correct.
 */
export class ChoiceAnswer<K extends string = string> {
  readonly type = "choice" as const;

  constructor(
    readonly choice: K,
    readonly probabilities: Readonly<Record<K, number>>,
    readonly confidence: number
  ) {
    Object.freeze(this.probabilities);
    Object.freeze(this);
  }

  toJSON() {
    return {
      type: this.type,
      choice: this.choice,
      probabilities: this.probabilities,
      confidence: this.confidence
    };
  }
}

/**
 * A probability-weighted position on an ordered scale. Level 0 is the first
 * level, so with three levels the score runs from 0 to 2 and can fall between
 * them. `probabilities` is keyed by level index.
 */
export class ScoreAnswer {
  readonly type = "score" as const;

  constructor(
    readonly score: number,
    readonly levels: readonly Description[],
    readonly probabilities: Readonly<Record<number, number>>,
    readonly confidence: number
  ) {
    Object.freeze(this.levels);
    Object.freeze(this.probabilities);
    Object.freeze(this);
  }

  toJSON() {
    return {
      type: this.type,
      score: this.score,
      levels: this.levels,
      probabilities: this.probabilities,
      confidence: this.confidence
    };
  }
}

export type Answer = ProbabilityAnswer | ChoiceAnswer | ScoreAnswer;

/** The answer type a question produces. */
export type AnswerFor<D extends QuestionDefinition> = D extends ProbabilityQuestion
  ? ProbabilityAnswer
  : D extends ChoiceQuestion<infer K>
    ? ChoiceAnswer<K>
    : D extends ScoreQuestion
      ? ScoreAnswer
      : never;

/** Answers keyed by question name, typed from the questions asked. */
export type AnswersOf<Q extends QuestionMap> = { readonly [N in keyof Q]: AnswerFor<Q[N]> };

/**
 * The typed answers to a set of questions, with the model that answered them
 * and the tokens it used.
 *
 * Answers are available by name - `judgment.urgent.probability` - and through
 * `judgment.answers`. A question named like one of Judgment's own members
 * (`model`, `usage`, `get`, ...) is only reachable through `answers` or `get`.
 */
export class Judgment<Q extends QuestionMap = QuestionMap> {
  constructor(
    readonly answers: AnswersOf<Q>,
    /** The model that answered, as reported by the provider. */
    readonly model: string,
    /** Token usage. `cost` is present only when the model has known pricing. */
    readonly usage: Usage,
    /** The provider's raw response. */
    readonly raw?: unknown
  ) {
    Object.freeze(this.answers);
    for (const name of Object.keys(answers)) {
      if (name in this) continue;
      Object.defineProperty(this, name, {
        value: (answers as Record<string, Answer>)[name],
        enumerable: false
      });
    }
    Object.freeze(this);
  }

  /** Returns the named answer, or undefined when there is none. */
  get<N extends keyof Q & string>(name: N): AnswersOf<Q>[N] | undefined {
    return Object.prototype.hasOwnProperty.call(this.answers, name)
      ? (this.answers as AnswersOf<Q>)[name]
      : undefined;
  }

  /** Returns the named answer, throwing when there is none. */
  fetch<N extends keyof Q & string>(name: N): AnswersOf<Q>[N] {
    const answer = this.get(name);
    if (answer === undefined) throw new Error(`No answer named '${name}' in this judgment`);
    return answer;
  }

  *[Symbol.iterator](): IterableIterator<[keyof Q & string, Answer]> {
    for (const [name, answer] of Object.entries(this.answers)) {
      yield [name as keyof Q & string, answer as Answer];
    }
  }

  toJSON() {
    return {
      model: this.model,
      answers: Object.fromEntries(
        Object.entries(this.answers).map(([name, answer]) => [name, (answer as Answer).toJSON()])
      ),
      usage: this.usage
    };
  }
}

/** A Judgment whose answers can also be read directly by question name. */
export type JudgmentResult<Q extends QuestionMap = QuestionMap> = Judgment<Q> &
  Omit<AnswersOf<Q>, keyof Judgment<Q>>;

/**
 * Wraps a provider's answers in typed, frozen answer objects. Every question
 * must come back answered with the type it was asked as; anything else means
 * the provider and the request disagree, and is reported rather than guessed.
 */
export function buildJudgment<Q extends QuestionMap>(
  response: JudgmentResponse,
  questions: NamedQuestion[]
): JudgmentResult<Q> {
  const answers: Record<string, Answer> = {};

  for (const question of questions) {
    const data = response.answers[question.name];
    if (!data) throw new Error(`The provider returned no answer for '${question.name}'`);
    if (data.type !== question.type) {
      throw new Error(
        `The provider answered '${question.name}' as a ${data.type}, but it was asked as a ${question.type}`
      );
    }

    switch (data.type) {
      case "probability":
        answers[question.name] = new ProbabilityAnswer(data.probability);
        break;
      case "choice":
        answers[question.name] = new ChoiceAnswer(
          data.choice,
          { ...data.probabilities },
          data.confidence
        );
        break;
      case "score":
        // Copy the levels: the answer is frozen, and freezing the caller's own
        // question definition would be a surprising side effect.
        answers[question.name] = new ScoreAnswer(
          data.score,
          structuredClone((question as ScoreQuestion).levels),
          { ...data.probabilities },
          data.confidence
        );
        break;
    }
  }

  return new Judgment(
    answers as AnswersOf<Q>,
    response.model,
    response.usage,
    response.raw
  ) as JudgmentResult<Q>;
}
