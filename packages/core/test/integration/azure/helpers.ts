import { createLLM } from "../../../src/index.js";

/** The deployment the recordings were made with */
export const DEPLOYMENT = "gpt-4o";

const resource = () => new URL(process.env.AZURE_API_BASE!).origin;

/** The addresses the Azure portal shows, for the same resource and deployment */
export const addresses = {
  deployment: () => `${resource()}/openai/deployments/${DEPLOYMENT}?api-version=2024-08-01-preview`,
  v1: () => `${resource()}/openai/v1`,
  resource
};

export const azure = (address: keyof typeof addresses = "v1") =>
  createLLM({
    provider: "azure",
    azureApiKey: process.env.AZURE_API_KEY,
    azureApiBase: addresses[address]()
  });
