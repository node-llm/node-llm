#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
DEEPSEEK_API_KEY=$(grep "^DEEPSEEK_API_KEY=" .env | cut -d '=' -f2)
export DEEPSEEK_API_KEY

if [ -z "$DEEPSEEK_API_KEY" ]; then
  echo "Error: DEEPSEEK_API_KEY not found in .env"
  exit 1
fi

echo "Found API Key: ${DEEPSEEK_API_KEY:0:5}..."

# List of DeepSeek examples
EXAMPLES=(
  "discovery/models.mjs"
  "chat/basic.mjs"
  "chat/streaming.mjs"
  "chat/events.mjs"
  "chat/instructions.mjs"
  "chat/max-tokens.mjs"
  "chat/params.mjs"
  "chat/structured.mjs"
  "chat/tools.mjs"
  "chat/raw-json.mjs"
  "chat/streaming-tools.mjs"
  "chat/reasoning.mjs"
  "chat/usage.mjs"
  "embeddings/basic.mjs"
  "images/generate.mjs"
  "multimodal/vision.mjs"
  "safety/moderation.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/deepseek/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1 # Brief pause to respect rate limits
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All DeepSeek examples passed!"
else
  echo "❌ The following DeepSeek examples failed: $FAILED"
  exit 1
fi
