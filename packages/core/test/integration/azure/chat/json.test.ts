import { describe, it, expect, afterEach } from "vitest";
import { z } from "zod/v3";
import { setupVCR } from "../../../helpers/vcr.js";
import { azure, DEPLOYMENT } from "../helpers.js";
import "dotenv/config";

describe("Azure Structured Output Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should return structured output from a Zod schema", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure()
      .chat(DEPLOYMENT)
      .withSchema(z.object({ city: z.string(), country: z.string() }))
      .ask("Give the city and country of the Eiffel Tower.");

    expect(response.data).toMatchObject({
      city: expect.stringMatching(/paris/i),
      country: expect.stringMatching(/france/i)
    });
  });

  it("should support JSON mode", async ({ task }) => {
    polly = setupVCR(task.name, "azure");

    const response = await azure()
      .chat(DEPLOYMENT)
      .withRequestOptions({ responseFormat: { type: "json_object" } })
      .ask("Return a JSON object with name and age fields for a person named Alice who is 30.");

    expect(response.data).toMatchObject({ name: "Alice", age: 30 });
  });
});
