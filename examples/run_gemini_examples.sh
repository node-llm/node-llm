#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
GEMINI_API_KEY=$(grep GEMINI_API_KEY .env | cut -d '=' -f2)
export GEMINI_API_KEY

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY not found in .env"
  exit 1
fi

echo "Found API Key: ${GEMINI_API_KEY:0:5}..."

# List of Gemini examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/instructions.mjs"
  "chat/tools.mjs"
  "chat/events.mjs"
  "chat/usage.mjs"
  "chat/parallel-tools.mjs"
  "chat/max-tokens.mjs"
  "chat/structured.mjs"
  "chat/params.mjs"
  "multimodal/vision.mjs"
  "multimodal/multi-image.mjs"
  "multimodal/files.mjs"
  "discovery/models.mjs"
  "embeddings/create.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/gemini/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All Gemini examples passed!"
else
  echo "❌ The following Gemini examples failed: $FAILED"
  exit 1
fi
