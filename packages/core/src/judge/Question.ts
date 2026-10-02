/**
 * Typed questions for judgments.
 *
 * A judgment asks a set of named questions about one input and returns a typed
 * answer for each: the probability that a statement holds, a choice among named
 * options, or a score on an ordered scale. Questions are plain data, so they
 * can be declared on a Judge class, passed to NodeLLM.judge, or built at
 * runtime from application data.
 */

/** A JSON-compatible value, used for descriptions and structured input. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Describes a question, an option, or a level. Text is usual; an object or
 * array carries structured instructions, and null means "no description".
 */
export type Description = string | null | JsonValue[] | { [key: string]: JsonValue };

/** The yes/no boundary of a probability question. Either side is optional. */
export interface ProbabilityCriteria {
  yes?: Description;
  no?: Description;
}

export interface ProbabilityQuestion {
  type: "probability";
  instructions?: Description;
  criteria?: ProbabilityCriteria;
}

export interface ChoiceQuestion<K extends string = string> {
  type: "choice";
  instructions?: Description;
  options: Record<K, Description>;
}

export interface ScoreQuestion {
  type: "score";
  instructions?: Description;
  levels: Description[];
}

export type QuestionDefinition = ProbabilityQuestion | ChoiceQuestion | ScoreQuestion;

/** Questions keyed by the name your code reads the answer from. */
export type QuestionMap = Record<string, QuestionDefinition>;

/** A question after validation, carrying its name for the provider. */
export type NamedQuestion = QuestionDefinition & { name: string };

/**
 * Declares a yes/no question whose answer is the probability of yes. A value
 * near 0.5 means yes and no are about equally likely, not "medium"; use a
 * score to measure degree.
 *
 * @example
 * probability("Does this need attention today?", {
 *   yes: "An explicit deadline today or an ongoing outage",
 *   no: "A general question with no time pressure"
 * })
 */
export function probability(
  instructions?: Description,
  criteria?: ProbabilityCriteria
): ProbabilityQuestion {
  return { type: "probability", instructions, ...(criteria ? { criteria } : {}) };
}

/**
 * Declares a question that selects one named option and returns a probability
 * for every option. Include a catch-all such as `other` when none of the
 * specific options may fit. Use null for an option that needs no description.
 *
 * @example
 * choice("Which team should handle this?", {
 *   billing: "Payments and refunds",
 *   technical: "Bugs and integrations",
 *   other: null
 * })
 */
export function choice<const O extends Record<string, Description>>(
  instructions: Description | undefined,
  options: O
): ChoiceQuestion<Extract<keyof O, string>> {
  return { type: "choice", instructions, options };
}

/**
 * Declares a question scored against ordered levels. The first level is 0, the
 * second 1, and so on; the answer is probability-weighted and can fall between
 * levels. Describe each level concretely.
 *
 * @example
 * score("How frustrated is the customer?", ["Calm", "Frustrated", "Angry"])
 */
export function score(instructions: Description | undefined, levels: Description[]): ScoreQuestion {
  return { type: "score", instructions, levels };
}

function isDescription(value: unknown): boolean {
  if (value === null || typeof value === "string") return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value === "object") return isJson(value);
  return false;
}

function isJson(value: unknown): boolean {
  if (value === null) return true;
  switch (typeof value) {
    case "string":
    case "boolean":
      return true;
    case "number":
      return Number.isFinite(value);
    case "object":
      if (Array.isArray(value)) return value.every(isJson);
      if (
        Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null
      ) {
        return false;
      }
      return Object.values(value as Record<string, unknown>).every(isJson);
    default:
      return false;
  }
}

function invalid(name: string, message: string): never {
  throw new Error(`Invalid judgment question '${name}': ${message}`);
}

function validateDescriptions(name: string, values: unknown[]): void {
  if (!values.every(isDescription)) {
    invalid(name, "descriptions must be text, an object, an array, or null");
  }
}

/**
 * Validates every question and returns them in declaration order with their
 * names attached. Rejects the problems a provider would otherwise report as an
 * opaque 400: unknown types, empty choices or scales, and probability criteria
 * that describe anything other than yes and no.
 */
export function normalizeQuestions(questions: QuestionMap): NamedQuestion[] {
  if (!questions || typeof questions !== "object" || Array.isArray(questions)) {
    throw new Error("Judgment questions must be an object keyed by question name");
  }

  const entries = Object.entries(questions);
  if (entries.length === 0) {
    throw new Error("A judgment needs at least one question");
  }

  return entries.map(([name, question]) => {
    if (name.length === 0) invalid(name, "a question name cannot be empty");
    if (!question || typeof question !== "object")
      invalid(name, "the definition must be an object");

    if (question.instructions !== undefined && !isDescription(question.instructions)) {
      invalid(name, "instructions must be text, an object, an array, or null");
    }

    switch (question.type) {
      case "probability":
        validateProbability(name, question);
        break;
      case "choice":
        validateChoice(name, question);
        break;
      case "score":
        validateScore(name, question);
        break;
      default:
        invalid(name, `unknown type '${String((question as { type?: unknown }).type)}'`);
    }

    return { ...question, name } as NamedQuestion;
  });
}

function validateProbability(name: string, question: ProbabilityQuestion): void {
  const extra = Object.keys(question).filter(
    (k) => !["type", "instructions", "criteria"].includes(k)
  );
  if (extra.length > 0) invalid(name, `unknown fields ${extra.join(", ")}`);
  if (question.criteria === undefined) return;

  const criteria = question.criteria as Record<string, unknown>;
  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
    invalid(name, "probability criteria must describe yes and no");
  }
  const keys = Object.keys(criteria);
  const unknown = keys.filter((k) => !["yes", "no", "true", "false"].includes(k));
  if (unknown.length > 0) invalid(name, "probability criteria must describe yes and no");

  // yes/true and no/false are the same outcome; describing one twice is ambiguous.
  const positives = keys.filter((k) => k === "yes" || k === "true").length;
  const negatives = keys.filter((k) => k === "no" || k === "false").length;
  if (positives > 1 || negatives > 1)
    invalid(name, "probability criteria contain duplicate outcomes");

  validateDescriptions(name, Object.values(criteria));
}

function validateChoice(name: string, question: ChoiceQuestion): void {
  const extra = Object.keys(question).filter(
    (k) => !["type", "instructions", "options"].includes(k)
  );
  if (extra.length > 0) invalid(name, `unknown fields ${extra.join(", ")}`);

  const options = question.options as Record<string, unknown> | undefined;
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    invalid(name, "a choice needs a non-empty object of options");
  }
  const keys = Object.keys(options);
  if (keys.length === 0) invalid(name, "a choice needs a non-empty object of options");
  if (keys.some((k) => k.length === 0)) invalid(name, "choice options must have non-empty names");

  validateDescriptions(name, Object.values(options));
}

function validateScore(name: string, question: ScoreQuestion): void {
  const extra = Object.keys(question).filter(
    (k) => !["type", "instructions", "levels"].includes(k)
  );
  if (extra.length > 0) invalid(name, `unknown fields ${extra.join(", ")}`);

  if (!Array.isArray(question.levels) || question.levels.length === 0) {
    invalid(name, "a score needs a non-empty array of levels");
  }
  validateDescriptions(name, question.levels);
}

/** True when the value can be sent as judgment input. */
export function isJudgmentInput(value: unknown): boolean {
  if (typeof value === "string") return true;
  if (Array.isArray(value)) return isJson(value);
  if (value !== null && typeof value === "object") return isJson(value);
  return false;
}
