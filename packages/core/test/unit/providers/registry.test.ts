import { describe, it, expect, vi } from "vitest";
import { providerRegistry } from "../../../src/providers/registry.js";
import { Provider } from "../../../src/providers/Provider.js";

describe("ProviderRegistry", () => {
  it("should register and resolve a provider", () => {
    const mockProvider = {} as Provider;
    const factory = vi.fn(() => mockProvider);

    providerRegistry.register("test-provider", factory);

    expect(providerRegistry.list()).toContain("test-provider");
    expect(providerRegistry.resolve("test-provider")).toBe(mockProvider);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should be idempotent on registration", () => {
    const factory1 = () => ({}) as Provider;
    const factory2 = () => ({}) as Provider;

    providerRegistry.register("idempotent-test", factory1);
    providerRegistry.register("idempotent-test", factory2);

    // Should still use factory1 if we just check the entry existance
    // but the implementation just returns if it exists.
    expect(providerRegistry.list()).toContain("idempotent-test");
  });

  it("should throw error for unknown provider", () => {
    expect(() => providerRegistry.resolve("non-existent")).toThrow(
      "Provider non-existent not registered"
    );
  });

  it("should list all registered providers", () => {
    providerRegistry.register("p1", () => ({}) as Provider);
    providerRegistry.register("p2", () => ({}) as Provider);

    const list = providerRegistry.list();
    expect(list).toContain("p1");
    expect(list).toContain("p2");
  });
});
