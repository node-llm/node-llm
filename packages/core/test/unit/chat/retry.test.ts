import { expect, it } from "vitest";
import { createLLM } from "../../../src/llm.js";
import { ServerError } from "../../../src/errors/index.js";
import { Provider } from "../../../src/providers/Provider.js";

it("retries provider failures", async () => {
  let calls = 0;

  const provider = {
    id: "test",
    async chat() {
      calls++;
      if (calls < 3) {
        throw new ServerError("Temporary failure", 500, {});
      }
      return { content: "ok" };
    }
  };

  const llm = createLLM({
    provider: provider as unknown as Provider,
    retry: { attempts: 3 }
  });

  const chat = llm.chat("test");

  const result = await chat.ask("hi");

  expect(String(result)).toBe("ok");
  expect(calls).toBe(3);
});
