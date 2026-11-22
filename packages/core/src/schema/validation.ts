/** One way a structured response failed its schema. */
export interface SchemaProblem {
  /** Where in the response, such as `steps[2].status`; empty for the whole response */
  path: string;
  /** What the schema says, in the schema library's words */
  message: string;
  /** The values the schema allows, for an enum or literal */
  expected?: unknown[];
  /** The value the model sent at `path`; undefined when it left the field out */
  received?: unknown;
}

interface ZodIssueLike {
  path?: PropertyKey[];
  message?: string;
  /** Zod 4 enum and literal issues */
  values?: unknown[];
  /** Zod 3 enum issues */
  options?: unknown[];
}

/**
 * Makes a schema library's validation error readable, keeping its type so `instanceof ZodError`
 * still works. Its message becomes one line naming each field, the values the schema allows and
 * the value received; Zod 4's own message is its issues as indented JSON, whose first line is
 * just "[". The parts are also set as `problems`. Other errors are returned as they are.
 */
export function readableSchemaError(error: unknown, schemaName: string, value: unknown): unknown {
  const issues = (error as { issues?: unknown } | null)?.issues;
  if (!(error instanceof Error) || !Array.isArray(issues) || issues.length === 0) return error;

  const problems: SchemaProblem[] = (issues as ZodIssueLike[]).map((issue) => {
    const path = issue.path ?? [];
    const expected = issue.values ?? issue.options;
    return {
      path: formatPath(path),
      message: issue.message ?? "Invalid value",
      ...(expected ? { expected } : {}),
      // Read from the response: Zod 3's own `received` is the type's name for a wrong type.
      received: valueAt(value, path)
    };
  });
  const message = `Response did not match the "${schemaName}" schema: ${problems.map(describe).join("; ")}`;
  Object.defineProperty(error, "message", { value: message, configurable: true, writable: true });
  Object.defineProperty(error, "problems", { value: problems, configurable: true, writable: true });
  return error;
}

function describe(problem: SchemaProblem): string {
  const where = problem.path || "response";
  if (problem.received === undefined) return `${where}: ${problem.message}`;
  // Zod 3 messages already name the value sent; Zod 4 messages don't.
  const shown = preview(problem.received);
  const named =
    problem.message.includes(shown) ||
    (typeof problem.received === "string" && problem.message.includes(`'${problem.received}'`));
  return named ? `${where}: ${problem.message}` : `${where}: ${problem.message} (got ${shown})`;
}

function preview(value: unknown): string {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((text, key) => {
    if (typeof key === "number") return `${text}[${key}]`;
    return text ? `${text}.${String(key)}` : String(key);
  }, "");
}

function valueAt(value: unknown, path: PropertyKey[]): unknown {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<PropertyKey, unknown>)[key];
  }
  return current;
}
