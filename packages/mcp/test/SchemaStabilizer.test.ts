import { describe, it, expect } from "vitest";
import { SchemaStabilizer } from "../src/SchemaStabilizer.js";

describe("SchemaStabilizer", () => {
  it("should add empty properties to objects that lack them", () => {
    const input = {
      type: "object",
      required: ["foo"]
      // missing properties
    };

    const output = SchemaStabilizer.stabilize(input);

    expect(output).toHaveProperty("properties");
    expect(output.properties).toEqual({});
  });

  it("should recursively stabilize nested objects", () => {
    const input = {
      type: "object",
      properties: {
        nested: {
          type: "object"
          // missing properties
        }
      }
    };

    const output = SchemaStabilizer.stabilize(input);

    expect(output.properties.nested).toHaveProperty("properties");
    expect(output.properties.nested.properties).toEqual({});
  });

  it("should remove non-standard keys like $schema and additionalProperties", () => {
    const input = {
      type: "object",
      $schema: "http://json-schema.org/draft-07/schema#",
      additionalProperties: false,
      properties: {
        foo: { type: "string" }
      }
    };

    const output = SchemaStabilizer.stabilize(input);

    expect(output).not.toHaveProperty("$schema");
    expect(output).not.toHaveProperty("additionalProperties");
  });
});
