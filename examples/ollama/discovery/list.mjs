import { NodeLLM } from "../../../packages/core/dist/index.js";

/**
 * This example demonstrates how to list and inspect local models available in Ollama.
 * 
 * Prerequisites:
 * 1. Install Ollama (https://ollama.ai)
 * 2. Ensure Ollama is running (`ollama serve`)
 */

async function main() {
    try {
        console.log("🔍 Listing Ollama Models...\n");

        // Simple configuration
        NodeLLM.configure({
            provider: "ollama",
            // Use environment variable if available, otherwise default to local
            ollamaApiBase: process.env.OLLAMA_API_BASE || "http://localhost:11434/v1"
        });

        // Fetch models
        const models = await NodeLLM.listModels();

        if (models.length === 0) {
            console.log("⚠️ No models found in your Ollama library.");
            console.log("Run `ollama pull llama3` to get started.");
            return;
        }

        console.log(`✅ Found ${models.length} models:\n`);

        // Display as a table
        console.table(models.map(m => ({
            ID: m.id,
            Name: m.name,
            Family: m.family,
            "Context Window": m.context_window ? `${m.context_window.toLocaleString()} tokens` : "Unknown",
            Capabilities: m.capabilities.join(", ")
        })));

        console.log("\n💡 Tip: Use `NodeLLM.chat(modelId)` with any of the IDs above.");

    } catch (error) {
        if (error.message.includes("ECONNREFUSED")) {
            console.error("❌ Error: Could not connect to Ollama.");
            console.error("Make sure Ollama is running (`ollama serve`).");
        } else {
            console.error("❌ Error:", error.message);
        }
    }
}

main();
