import { Provider } from "../src/providers/Provider.js";

export class FakeStreamingProvider implements Provider {
  id = "fake-streaming";

  async chat() {
    return { content: "not used" };
  }

  async *stream() {
    yield { content: "Hello " };
    yield { content: "world" };
  }

  defaultModel() {
    return "fake-model";
  }
}
