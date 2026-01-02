# Node-LLM Examples

This directory contains examples demonstrating how to use various providers with `node-llm`.

## Available Providers
- **DeepSeek**: `examples/deepseek/`
- **OpenAI**: `examples/openai/`
- **Anthropic**: `examples/anthropic/`
- **Gemini**: `examples/gemini/`

## Prerequisites

1.  **Environment Variables**: Ensure you have a `.env` file in the root of your project with the API keys for the providers you want to use:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    DEEPSEEK_API_KEY=your_deepseek_api_key
    ANTHROPIC_API_KEY=your_anthropic_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

2.  **Build**: Before running examples, make sure the core package is built:
    ```bash
    npm run build --workspace=packages/core
    ```

## OpenAI Examples (Primary)

OpenAI is the most feature-complete provider in `node-llm`.

### 1. Running All OpenAI Examples
To run the full suite of OpenAI examples:
```bash
./examples/run_openai_examples.sh
```

### 2. Running Individual OpenAI Examples
*   **Basic Chat**: `node examples/openai/chat/basic.mjs`
*   **Streaming**: `node examples/openai/chat/streaming.mjs`
*   **Tools**: `node examples/openai/chat/tools.mjs`
*   **Vision**: `node examples/openai/multimodal/vision.mjs`
*   **Speech (TTS)**: `node examples/openai/multimodal/audio.mjs`
*   **Image Generation**: `node examples/openai/images/generate.mjs`

---

## DeepSeek Examples

You can run DeepSeek examples individually using `node` or run the entire suite using the provided shell script.

### 1. Running All DeepSeek Examples

To run all available DeepSeek examples to verify functionality:

```bash
./examples/run_deepseek_examples.sh
```

### 2. Running Individual DeepSeek Examples

*   **Chat**: `node examples/deepseek/chat/basic.mjs`
*   **Streaming**: `node examples/deepseek/chat/streaming.mjs`
*   **Structured Output**: `node examples/deepseek/chat/structured.mjs`
*   **Tools**: `node examples/deepseek/chat/tools.mjs`
*   **Model Info**: `node examples/deepseek/discovery/models.mjs`

### 3. Unsupported Features (Error Handling)
These scripts demonstrate that `node-llm` correctly raises errors for features not supported by DeepSeek (Multimodal, Embeddings, Image Generation).

*   `node examples/deepseek/multimodal/vision.mjs`
*   `node examples/deepseek/embeddings/basic.mjs`
*   `node examples/deepseek/images/generate.mjs`
*   `node examples/deepseek/safety/moderation.mjs`

## Troubleshooting

*   **API Key Error**: Ensure the relevant API key (e.g., `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`) is set in your `.env` file.
*   **Build Errors**: Run `npm run build --workspace=packages/core` if you recently changed core code.
*   **Rate Limits**: Providers have rate limits. If scripts fail with 429 errors, wait a moment and try again. The runner scripts include delays to mitigate this.
