# NodeLLM Examples

This directory contains examples demonstrating how to integrate LLMs as an architectural surface using `NodeLLM`.

## Available Providers
- **DeepSeek**: `examples/deepseek/`
- **OpenAI**: `examples/openai/`
- **Anthropic**: `examples/anthropic/`
- **Gemini**: `examples/gemini/`
- **OpenRouter**: `examples/openrouter/`
- **Ollama**: `examples/ollama/`
- **Core (Advanced)**: `examples/core/`

## Prerequisites

1.  **Environment Variables**: Ensure you have a `.env` file in the root of your project with the API keys for the providers you want to use:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    DEEPSEEK_API_KEY=your_deepseek_api_key
    ANTHROPIC_API_KEY=your_anthropic_api_key
    GEMINI_API_KEY=your_gemini_api_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

2.  **Build**: Before running examples, make sure the core package is built:
    ```bash
    npm run build --workspace=packages/core
    ```

## Configuration Example

Learn how to configure `NodeLLM`:

```bash
### Configuration

The examples use `NodeLLM.configure` to set up the provider. You can pass your API key directly in the configuration object:

```javascript
NodeLLM.configure({
  openaiApiKey: process.env.OPENAI_API_KEY,
  provider: "openai" 
});
```

See [CONFIGURATION.md](../docs/CONFIGURATION.md) for full details.

---

## OpenAI Examples (Primary)

OpenAI is the most feature-complete provider in `NodeLLM`.

### 1. Running All OpenAI Examples
To run the full suite of OpenAI examples:
```bash
./examples/openai/run.sh
```

### 2. Security & Resource Limits (NEW)
*   **Complete Security Config**: `node examples/openai/security/configuration.mjs`
*   **Request Timeouts**: `node examples/openai/security/request-timeout.mjs`
*   **Content Policy Hooks**: `node examples/openai/security/content-policy-hooks.mjs`
*   **Tool Verification Policy**: `node examples/openai/security/tool-policies.mjs`

### 3. Running Individual OpenAI Examples
*   **Basic Chat**: `node examples/openai/chat/basic.mjs`
*   **Streaming**: `node examples/openai/chat/streaming.mjs`
*   **Tools (Class-Based)**: `node examples/openai/chat/tools.mjs`
*   **Tools (Raw JSON)**: `node examples/openai/chat/raw-json.mjs`
*   **Reasoning (o1/o3)**: `node examples/openai/chat/reasoning.mjs`
*   **Vision**: `node examples/openai/multimodal/vision.mjs`
*   **Speech (TTS)**: `node examples/openai/multimodal/audio.mjs`
*   **Image Generation**: `node examples/openai/images/generate.mjs`

### 4. Advanced Core Patterns
*   **Global Configuration**: `node examples/openai/core/configuration.mjs`
*   **Support Agent Pattern**: `node examples/openai/core/support-agent.mjs`
*   **Parallel Provider Scoring**: `node examples/openai/core/parallel-scoring.mjs`
*   **Custom API Endpoints**: `node examples/openai/core/custom-endpoints.mjs`
*   **Custom Provider Implementation**: `node examples/core/custom-provider.mjs`

---

## DeepSeek Examples

You can run DeepSeek examples individually using `node` or run the entire suite using the provided shell script.

### 1. Running All DeepSeek Examples

To run all available DeepSeek examples to verify functionality:

```bash
./examples/deepseek/run.sh
```

### 2. Running Individual DeepSeek Examples

*   **Chat**: `node examples/deepseek/chat/basic.mjs`
*   **Streaming**: `node examples/deepseek/chat/streaming.mjs`
*   **Structured Output**: `node examples/deepseek/chat/structured.mjs`
*   **Tools (Class-Based)**: `node examples/deepseek/chat/tools.mjs`
*   **Tools (Raw JSON)**: `node examples/deepseek/chat/raw-json.mjs`
*   **Reasoning (R1)**: `node examples/deepseek/chat/reasoning.mjs`
*   **Model Info**: `node examples/deepseek/discovery/models.mjs`

---

## Gemini Examples

### 1. Running All Gemini Examples
```bash
./examples/gemini/run.sh
```

### 2. Running Individual Gemini Examples
*   **Basic Chat**: `node examples/gemini/chat/basic.mjs`
*   **Tools (Class-Based)**: `node examples/gemini/chat/tools.mjs`
*   **Tools (Raw JSON)**: `node examples/gemini/chat/raw-json.mjs`
*   **Vision**: `node examples/gemini/multimodal/vision.mjs`
*   **Embeddings**: `node examples/gemini/embeddings/create.mjs`

---

## Anthropic Examples

### 1. Running All Anthropic Examples
```bash
./examples/anthropic/run.sh
```

### 2. Running Individual Anthropic Examples
*   **Basic Chat**: `node examples/anthropic/chat/basic.mjs`
*   **Tools (Class-Based)**: `node examples/anthropic/chat/tools.mjs`
*   **Tools (Raw JSON)**: `node examples/anthropic/chat/raw-json.mjs`
*   **Streaming Tools**: `node examples/anthropic/chat/streaming-tools.mjs`

### 3. Unsupported Features (Error Handling)
These scripts demonstrate that `NodeLLM` correctly raises errors for features not supported by DeepSeek (Multimodal, Embeddings, Image Generation).

*   `node examples/deepseek/multimodal/vision.mjs`
*   `node examples/deepseek/embeddings/basic.mjs`
*   `node examples/deepseek/images/generate.mjs`
*   `node examples/deepseek/safety/moderation.mjs`

---

## OpenRouter Examples

### 1. Running All OpenRouter Examples
```bash
./examples/openrouter/run.sh
```

### 2. Running Individual OpenRouter Examples
*   **Basic Chat**: `node examples/openrouter/chat/basic.mjs`
*   **Streaming**: `node examples/openrouter/chat/streaming.mjs`
*   **Tools**: `node examples/openrouter/chat/tools.mjs`
*   **Reasoning**: `node examples/openrouter/chat/reasoning.mjs`
*   **Embeddings**: `node examples/openrouter/embeddings/create.mjs`

## Troubleshooting

*   **API Key Error**: Ensure the relevant API key (e.g., `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`) is set in your `.env` file.
*   **Build Errors**: Run `npm run build --workspace=packages/core` if you recently changed core code.
*   **Rate Limits**: Providers have rate limits. If scripts fail with 429 errors, wait a moment and try again. The runner scripts include delays to mitigate this.
