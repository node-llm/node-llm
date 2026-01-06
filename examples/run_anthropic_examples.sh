#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env | cut -d '=' -f2)
export ANTHROPIC_API_KEY

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY not found in .env"
  exit 1
fi

echo "Found API Key: ${ANTHROPIC_API_KEY:0:5}..."

# List of Anthropic examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/instructions.mjs"
  "chat/tools.mjs"
  "chat/raw-json.mjs"
  "chat/streaming.mjs"
  "chat/streaming-tools.mjs"
  "chat/events.mjs"
  "chat/usage.mjs"
  "chat/parallel-tools.mjs"
  "chat/max-tokens.mjs"
  "chat/structured.mjs"
  "multimodal/vision.mjs"
  "multimodal/multi-image.mjs"
  "multimodal/pdf.mjs"
  "multimodal/files.mjs"
  "multimodal/transcribe.mjs"
  "discovery/models.mjs"
  "discovery/alias-logging.mjs"
  "discovery/debug-mode.mjs"
  "discovery/model-aliases.mjs"
  "discovery/scoped-config.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/anthropic/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1 # Brief pause to respect rate limits
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All Anthropic examples passed!"
else
  echo "❌ The following Anthropic examples failed: $FAILED"
  exit 1
fi
