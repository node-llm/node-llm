import { Provider, ChatChunk } from "../../src/providers/Provider.js";

export class FakeStreamingProvider implements Provider {
  async chat() {
    return { content: "not used" };
  }

  async *stream() {
    yield { content: "Hello " };
    yield { content: "world" };
  }
}
