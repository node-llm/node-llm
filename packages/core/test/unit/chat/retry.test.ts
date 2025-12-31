import { expect, it } from "vitest";
import { LLM } from "../../../src/llm.js";
import { ServerError } from "../../../src/errors/index.js";

it("retries provider failures", async () => {
  let calls = 0;

  const provider = {
    async chat() {
      calls++;
      if (calls < 3) {
        throw new ServerError("Temporary failure", 500, {});
      }
      return { content: "ok" };
    },
  };

  LLM.configure({
    provider: provider as any,
    retry: { attempts: 3 },
  });

  const chat = LLM.chat("test");

  const result = await chat.ask("hi");

  expect(String(result)).toBe("ok");
  expect(calls).toBe(3);
});
