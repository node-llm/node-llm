#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
OPENROUTER_API_KEY=$(grep "^OPENROUTER_API_KEY=" .env | cut -d '=' -f2)
export OPENROUTER_API_KEY

if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "Error: OPENROUTER_API_KEY not found in .env"
  exit 1
fi

echo "Found API Key: ${OPENROUTER_API_KEY:0:5}..."

# List of OpenRouter examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/streaming.mjs"
  "chat/tools.mjs"
  "chat/reasoning.mjs"
  "discovery/models.mjs"
  "embeddings/create.mjs"
  "multimodal/vision.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/openrouter/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  # Pause for 3 seconds to avoid OpenRouter rate limits (especially for free/low-tier keys)
  sleep 3
done

# Trim leading/trailing whitespace
FAILED=$(echo "$FAILED" | xargs)

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All OpenRouter examples passed!"
else
  echo "❌ The following OpenRouter examples failed: $FAILED"
  exit 1
fi
