import { ModelRegistry } from "../../models/ModelRegistry.js";

/**
 * What a model can do on Azure, from the registry. A deployment the registry doesn't know, such
 * as one with its own name and no entry in `deployments`, is assumed able: Azure decides.
 */
export class AzureCapabilities {
  static findModel(modelId: string) {
    return ModelRegistry.find(modelId, "azure");
  }

  private static supports(modelId: string, ...capabilities: string[]): boolean {
    if (!this.findModel(modelId)) return true;
    return capabilities.some((capability) => ModelRegistry.supports(modelId, capability, "azure"));
  }

  static supportsVision(modelId: string): boolean {
    return this.supports(modelId, "vision");
  }

  static supportsTools(modelId: string): boolean {
    return this.supports(modelId, "tools", "function_calling");
  }

  static supportsStructuredOutput(modelId: string): boolean {
    return this.supports(modelId, "structured_output", "json_mode");
  }

  static supportsEmbeddings(modelId: string): boolean {
    return this.supports(modelId, "embeddings");
  }

  static supportsReasoning(modelId: string): boolean {
    return !!this.findModel(modelId) && ModelRegistry.supports(modelId, "reasoning", "azure");
  }

  static supportsTemperature(modelId: string): boolean {
    return ModelRegistry.supportsTemperature(modelId, "azure");
  }

  static getContextWindow(modelId: string): number | null {
    return ModelRegistry.getContextWindow(modelId, "azure") ?? null;
  }
}
