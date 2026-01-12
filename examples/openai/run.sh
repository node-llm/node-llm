#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2)
export OPENAI_API_KEY

echo "Found API Key: ${OPENAI_API_KEY:0:5}..."

# List of normalized OpenAI examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/instructions.mjs"
  "chat/tools.mjs"
  "chat/raw-json.mjs"
  "chat/streaming.mjs"
  "chat/streaming-tools.mjs"
  "chat/events.mjs"
  "chat/usage.mjs"
  "chat/reasoning.mjs"
  "chat/parallel-tools.mjs"
  "chat/params.mjs"
  "chat/structured.mjs"
  "chat/max-tokens.mjs"
  "multimodal/vision.mjs"
  "multimodal/multi-image.mjs"
  "multimodal/files.mjs"
  "multimodal/transcribe.mjs"
  "images/generate.mjs"
  "safety/moderation.mjs"
  "discovery/models.mjs"
  "embeddings/create.mjs"
  "security/configuration.mjs"
  "security/request-timeout.mjs"
  "security/content-policy-hooks.mjs"
  "security/tool-policies.mjs"
  "core/configuration.mjs"
  "core/support-agent.mjs"
  "core/parallel-scoring.mjs"
  "core/custom-endpoints.mjs"
)

# Run each example (assumes running from project root)
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/openai/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1 # Brief pause to respect rate limits
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All OpenAI examples passed!"
else
  echo "❌ The following OpenAI examples failed: $FAILED"
  exit 1
fi
