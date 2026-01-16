import { describe, it, expect } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { Tool } from "../../../src/chat/Tool.js";
import { FakeProvider } from "../../fake-provider.js";

class MockToolClass {
  type = "function" as const;
  function = {
    name: "mock_class_tool",
    parameters: {}
  };
  async handler() {
    return "class result";
  }
}

const mockToolInstance: Tool = {
  type: "function",
  function: {
    name: "mock_instance_tool",
    parameters: {}
  },
  handler: async () => "instance result"
};

describe("Chat Tool Management", () => {
  it("should add a single tool via withTool", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");

    chat.withTool(mockToolInstance);

    // Access private property 'options' via 'any' cast for testing state
    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(1);
    expect(tools[0]).toBe(mockToolInstance);
  });

  it("should add multiple tools instances via withTools", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");
    const anotherTool = {
      ...mockToolInstance,
      function: { ...mockToolInstance.function, name: "another" }
    };

    chat.withTools([mockToolInstance, anotherTool]);

    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(2);
    expect(tools[0].function.name).toBe("mock_instance_tool");
    expect(tools[1].function.name).toBe("another");
  });

  it("should instantiate tool classes automatically", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");

    chat.withTool(MockToolClass);

    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(1);
    expect(tools[0]).toBeInstanceOf(MockToolClass);
    expect(tools[0].function.name).toBe("mock_class_tool");
  });

  it("should mix instances and classes in withTools", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");

    chat.withTools([mockToolInstance, MockToolClass]);

    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(2);
    expect(tools[0].function.name).toBe("mock_instance_tool");
    expect(tools[1]).toBeInstanceOf(MockToolClass);
  });

  it("should replace tools when replace: true is passed", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");

    chat.withTool(mockToolInstance);
    // Replace with a class tool
    chat.withTools([MockToolClass], { replace: true });

    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(1);
    expect(tools[0]).toBeInstanceOf(MockToolClass);
    expect(tools[0].function.name).toBe("mock_class_tool");
  });

  it("should clear tools when empty array and replace: true passed", () => {
    const provider = new FakeProvider([]);
    const chat = new Chat(provider, "test-model");

    chat.withTool(mockToolInstance);
    chat.withTools([], { replace: true });

    const tools = (chat as unknown as { options: { tools: Tool[] } }).options.tools;
    expect(tools).toHaveLength(0);
  });
});
