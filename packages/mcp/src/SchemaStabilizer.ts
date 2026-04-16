/**
 * Utility to normalize JSON Schemas from MCP servers into a format
 * compatible with major LLM providers (especially OpenAI/Anthropic).
 */
export class SchemaStabilizer {
  /**
   * Recursively traverses a schema and applies fixes:
   * 1. Ensures 'type: object' always has a 'properties' object.
   * 2. Removes problematic keys like '$schema' or 'additionalProperties'.
   */
  static stabilize(schema: any): any {
    if (typeof schema !== "object" || schema === null) {
      return schema;
    }

    // Clone to avoid mutating original MCP metadata
    const stabilized = { ...schema };

    // Fix 1: Mandatory properties for objects
    if (stabilized.type === "object" && !stabilized.properties) {
      stabilized.properties = {};
    }

    // Fix 2: Recursive stabilization of properties
    if (stabilized.properties) {
      const newProps: Record<string, any> = {};
      for (const [key, value] of Object.entries(stabilized.properties)) {
        newProps[key] = this.stabilize(value);
      }
      stabilized.properties = newProps;
    }

    // Fix 3: Handle items for array types
    if (stabilized.type === "array" && stabilized.items) {
      stabilized.items = this.stabilize(stabilized.items);
    }

    // Fix 4: Clean up non-standard or problematic keys for LLM providers
    delete stabilized.$schema;
    delete stabilized.additionalProperties;

    return stabilized;
  }
}
