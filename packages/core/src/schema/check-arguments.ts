/**
 * A small check of tool arguments against the tool's JSON Schema: types, required fields,
 * enums and constants, nested objects and arrays, `anyOf`/`oneOf`, and extra fields where the
 * schema says `additionalProperties: false`. Keywords it doesn't know are ignored, so it only
 * refuses arguments the schema clearly rules out. Returns the problems found.
 */
export function checkArguments(schema: unknown, value: unknown, path = ""): string[] {
  if (!schema || typeof schema !== "object") return [];
  const s = schema as Record<string, unknown>;
  const where = path || "arguments";

  for (const key of ["anyOf", "oneOf"] as const) {
    const options = s[key];
    if (Array.isArray(options) && options.length > 0) {
      if (!options.some((option) => checkArguments(option, value, path).length === 0)) {
        return [`${where} matches none of the allowed shapes`];
      }
    }
  }
  if (Array.isArray(s.allOf)) {
    const problems = s.allOf.flatMap((part) => checkArguments(part, value, path));
    if (problems.length) return problems;
  }

  if ("const" in s && !sameValue(s.const, value)) {
    return [`${where} must be ${JSON.stringify(s.const)}`];
  }
  if (Array.isArray(s.enum) && !s.enum.some((allowed) => sameValue(allowed, value))) {
    return [`${where} must be one of ${s.enum.map((v) => JSON.stringify(v)).join(", ")}`];
  }

  const types = s.type === undefined ? [] : Array.isArray(s.type) ? s.type : [s.type];
  if (types.length > 0 && !types.some((type) => isType(type as string, value))) {
    return [`${where} must be ${types.join(" or ")}, got ${typeName(value)}`];
  }

  const problems: string[] = [];
  if (isPlainObject(value)) {
    const properties = (s.properties ?? {}) as Record<string, unknown>;
    for (const name of Array.isArray(s.required) ? (s.required as string[]) : []) {
      if (!(name in value)) problems.push(`${join(path, name)} is required`);
    }
    for (const [name, item] of Object.entries(value)) {
      if (name in properties)
        problems.push(...checkArguments(properties[name], item, join(path, name)));
      else if (s.additionalProperties === false)
        problems.push(`${join(path, name)} is not allowed`);
      else if (s.additionalProperties && typeof s.additionalProperties === "object")
        problems.push(...checkArguments(s.additionalProperties, item, join(path, name)));
    }
  } else if (Array.isArray(value) && s.items && typeof s.items === "object") {
    value.forEach((item, index) =>
      problems.push(...checkArguments(s.items, item, `${where}[${index}]`))
    );
  }
  return problems;
}

function join(path: string, name: string): string {
  return path ? `${path}.${name}` : name;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isType(type: string, value: unknown): boolean {
  switch (type) {
    case "object":
      return isPlainObject(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
