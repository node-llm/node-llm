import { describe, it, expect, vi } from "vitest";
import { Stream } from "../../../src/index.js";

describe("Advanced Stream Utility", () => {
  it("should collect all chunks into an array using .toArray()", async () => {
    async function* generator() {
      yield "a";
      yield "b";
      yield "c";
    }

    const stream = Stream.fromAsyncIterable(generator());
    const array = await stream.toArray();
    expect(array).toEqual(["a", "b", "c"]);
  });

  it("should split the stream into two using .tee()", async () => {
    async function* generator() {
      yield 1;
      yield 2;
      yield 3;
    }

    const stream = Stream.fromAsyncIterable(generator());
    const [left, right] = stream.tee();

    const [leftArray, rightArray] = await Promise.all([
      left.toArray(),
      right.toArray()
    ]);

    expect(leftArray).toEqual([1, 2, 3]);
    expect(rightArray).toEqual([1, 2, 3]);
  });

  it("should handle independent iteration speeds with .tee()", async () => {
    async function* generator() {
      yield "x";
      yield "y";
    }

    const stream = Stream.fromAsyncIterable(generator());
    const [left, right] = stream.tee();

    const leftIterator = left[Symbol.asyncIterator]();
    const rightIterator = right[Symbol.asyncIterator]();

    expect(await leftIterator.next()).toEqual({ value: "x", done: false });
    expect(await leftIterator.next()).toEqual({ value: "y", done: false });
    expect(await leftIterator.next()).toEqual({ value: undefined, done: true });

    // Right iterator can still be at the beginning
    expect(await rightIterator.next()).toEqual({ value: "x", done: false });
    expect(await rightIterator.next()).toEqual({ value: "y", done: false });
    expect(await rightIterator.next()).toEqual({ value: undefined, done: true });
  });

  it("should prevent double ingestion of the same stream", async () => {
    async function* generator() { yield 1; }
    const stream = Stream.fromAsyncIterable(generator());
    
    await stream.toArray();
    await expect(stream.toArray()).rejects.toThrow(/consumed/);
  });

  it("should support aborting the stream", async () => {
    const controller = new AbortController();
    const mockAbort = vi.fn();
    controller.signal.addEventListener("abort", mockAbort);

    async function* generator() {
      yield "chunk";
    }

    const stream = new Stream(() => generator(), controller);
    stream.abort();

    expect(mockAbort).toHaveBeenCalled();
    expect(controller.signal.aborted).toBe(true);
  });
});
