export function enforceStrictSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return schema;
  }

  const result: Record<string, unknown> = { ...schema };

  // If it's an object type, apply strict rules
  if (result.type === "object") {
    // 1. additionalProperties must be false (or set to false if omitted)
    if (!("additionalProperties" in result)) {
      result.additionalProperties = false;
    }

    // 2. All properties must be listed in the required array
    if (result.properties && typeof result.properties === "object") {
      const keys = Object.keys(result.properties as Record<string, unknown>);
      if (keys.length > 0) {
        const existingRequired = Array.isArray(result.required) ? result.required : [];
        const requiredSet = new Set([...existingRequired, ...keys]);
        result.required = Array.from(requiredSet);
      }

      // Recursively apply to all properties
      const newProps: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(
        result.properties as Record<string, Record<string, unknown>>
      )) {
        newProps[key] = enforceStrictSchema(propSchema);
      }
      result.properties = newProps;
    }
  }

  // Handle arrays recursively
  if (result.type === "array" && result.items && typeof result.items === "object") {
    result.items = enforceStrictSchema(result.items as Record<string, unknown>);
  }

  // Handle nested schemas in anyOf, allOf, oneOf
  for (const compound of ["anyOf", "allOf", "oneOf"]) {
    if (Array.isArray(result[compound])) {
      result[compound] = (result[compound] as Record<string, unknown>[]).map(enforceStrictSchema);
    }
  }

  return result;
}
