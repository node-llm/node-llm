import "dotenv/config";
import { NodeLLM, BaseProvider } from "../../packages/core/dist/index.js";

/**
 * EXAMPLE: Implementing a Custom Provider using BaseProvider
 * 
 * This is the RECOMMENDED way to extend NodeLLM.
 * Extending BaseProvider provides:
 * 1. Default implementations for unsupported features.
 * 2. Proper error handling (UnsupportedFeatureError).
 * 3. Consistent internal identification.
 */

class MyCustomMockProvider extends BaseProvider {
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.region = config.region;
  }

  /**
   * Required: Unique internal ID
   */
  providerName() {
    return "my-mock";
  }

  /**
   * Required: Base URL for your API
   */
  apiBase() {
    return "https://api.mock-service.ai";
  }

  /**
   * Required: Auth and content headers
   */
  headers() {
    return {
      "Content-Type": "application/json"
    };
  }

  /**
   * Required: Default model ID
   */
  defaultModel(feature = "chat") {
    return "mock-v1";
  }

  /**
   * Required: Core chat implementation
   */
  async chat(request) {
    console.log(`[MyMockProvider] Using Region: ${this.region}`);
    console.log(`[MyMockProvider] Request for model: ${request.model}`);
    
    // Demonstrate handling extra fields passed via .withParams()
    const { model, messages, ...extraFields } = request;
    if (Object.keys(extraFields).length > 0) {
      console.log(`[MyMockProvider] Extra fields received:`, JSON.stringify(extraFields, null, 2));
    }

    return {
      content: `Response for: "${messages[messages.length - 1].content}"`,
      usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
    };
  }

  /**
   * Optional: Overriding stream implementation
   */
  async *stream(request) {
    const text = "Streaming from custom provider... ";
    for (const word of text.split(" ")) {
      await new Promise(r => setTimeout(r, 50));
      yield { content: word + " " };
    }
  }
}

// 1. Register the custom provider
NodeLLM.registerProvider("my-mock", () => {
  return new MyCustomMockProvider({
    apiKey: "sk-mock-12345",
    region: "us-east-1"
  });
});

async function main() {
  console.log("=== RECOMMENDED: Custom Provider via BaseProvider ===\n");

  // 2. Configure NodeLLM
  NodeLLM.configure({ provider: "my-mock" });

  // 3. Simple execution
  console.log("--- Standard Chat ---");
  const response = await NodeLLM.chat().ask("Hello!");
  console.log("Response:", response.content);

  // 4. Sending extra provider-specific fields
  console.log("\n--- Chat with Extra Fields ---");
  const responseWithExtra = await NodeLLM
    .chat()
    .withParams({ 
      top_p: 0.9, 
      custom_flag: true,
      internal_routing_id: "node-1" 
    })
    .ask("What is the weather?");
  console.log("Response:", responseWithExtra.content);

  console.log("\n--- Streaming Chat ---");
  const stream = NodeLLM.chat().stream("Tell me more.");
  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
  console.log("\n");

  // 5. Verification of Unsupported Features
  console.log("--- Checking Unsupported Feature (Moderate) ---");
  try {
    await NodeLLM.moderate("test content");
  } catch (error) {
    console.log("Caught expected error:", error.message);
    // Output: "my-mock does not support moderate"
  }
}

main().catch(console.error);
