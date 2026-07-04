import { describe, it, expect } from "vitest";
import {
  collectHandlers,
  runAllHandlers,
  runDirectiveHandlers,
  runConfirmHandlers,
  runChainHandlers
} from "../../../src/utils/handler-stacking.js";

describe("collectHandlers", () => {
  it("puts the single constructor-provided handler first", () => {
    const single = () => "single";
    const a = () => "a";
    const b = () => "b";
    expect(collectHandlers(single, [a, b])).toEqual([single, a, b]);
  });

  it("returns just the list when there is no single handler", () => {
    const a = () => "a";
    expect(collectHandlers(undefined, [a])).toEqual([a]);
  });

  it("returns an empty array when nothing is registered", () => {
    expect(collectHandlers(undefined, undefined)).toEqual([]);
  });
});

describe("runAllHandlers", () => {
  it("calls every handler in order with the same args", async () => {
    const calls: string[] = [];
    await runAllHandlers(
      [(x: number) => calls.push(`first:${x}`), (x: number) => calls.push(`second:${x}`)],
      42
    );
    expect(calls).toEqual(["first:42", "second:42"]);
  });
});

describe("runDirectiveHandlers", () => {
  it("returns the first defined directive but still runs later handlers", async () => {
    const calls: string[] = [];
    const result = await runDirectiveHandlers<[string], "STOP" | "CONTINUE">(
      [
        (name) => {
          calls.push(name);
          return "STOP";
        },
        (name) => {
          calls.push(name);
          return "CONTINUE";
        }
      ],
      "err"
    );
    expect(result).toBe("STOP");
    expect(calls).toEqual(["err", "err"]);
  });

  it("returns undefined when no handler returns a directive", async () => {
    const result = await runDirectiveHandlers<[string], "STOP">(
      [(_name: string) => undefined, (_name: string) => undefined],
      "err"
    );
    expect(result).toBeUndefined();
  });
});

describe("runConfirmHandlers", () => {
  it("approves when there are no handlers", async () => {
    expect(await runConfirmHandlers<[string]>([], "call")).toBe(true);
  });

  it("requires every handler to approve", async () => {
    expect(
      await runConfirmHandlers<[string]>([(_call: string) => true, (_call: string) => true], "call")
    ).toBe(true);

    expect(
      await runConfirmHandlers<[string]>(
        [(_call: string) => true, (_call: string) => false],
        "call"
      )
    ).toBe(false);
  });
});

describe("runChainHandlers", () => {
  it("feeds each handler's output into the next", async () => {
    const result = await runChainHandlers<string[]>(
      [(messages) => [...messages, "a"], (messages) => [...messages, "b"]],
      ["start"]
    );
    expect(result).toEqual(["start", "a", "b"]);
  });

  it("keeps the previous value when a handler returns void", async () => {
    const result = await runChainHandlers<string[]>(
      [(messages) => [...messages, "a"], () => undefined],
      ["start"]
    );
    expect(result).toEqual(["start", "a"]);
  });
});
