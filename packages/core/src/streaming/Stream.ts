import { ChatChunk } from "../providers/Provider.js";

/**
 * Stream wrapper class inspired by OpenAI SDK
 * Provides utilities for working with async iterables
 */
export class Stream<T> implements AsyncIterable<T> {
  private consumed = false;

  constructor(
    private iterator: () => AsyncIterator<T>,
    private controller?: AbortController
  ) {}

  /**
   * Create a Stream from an async generator
   */
  static fromAsyncIterable<T>(
    iterable: AsyncIterable<T>,
    controller?: AbortController
  ): Stream<T> {
    return new Stream(() => iterable[Symbol.asyncIterator](), controller);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.consumed) {
      throw new Error('Cannot iterate over a consumed stream, use `.tee()` to split the stream.');
    }
    this.consumed = true;
    return this.iterator();
  }

  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee(): [Stream<T>, Stream<T>] {
    const left: Array<Promise<IteratorResult<T>>> = [];
    const right: Array<Promise<IteratorResult<T>>> = [];
    const iterator = this.iterator();

    const teeIterator = (queue: Array<Promise<IteratorResult<T>>>): AsyncIterator<T> => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift()!;
        },
      };
    };

    return [
      new Stream(() => teeIterator(left), this.controller),
      new Stream(() => teeIterator(right), this.controller),
    ];
  }

  /**
   * Collect all chunks into an array
   */
  async toArray(): Promise<T[]> {
    const result: T[] = [];
    for await (const chunk of this) {
      result.push(chunk);
    }
    return result;
  }

  /**
   * Abort the underlying stream
   */
  abort(): void {
    this.controller?.abort();
  }
}
