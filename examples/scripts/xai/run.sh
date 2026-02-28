#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
XAI_API_KEY=$(grep "^XAI_API_KEY=" .env | cut -d '=' -f2)
export XAI_API_KEY
export NODELLM_PROVIDER=xai

echo "Found API Key: ${XAI_API_KEY:0:5}..."

# List of normalized xAI examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/structured.mjs"
  "chat/streaming.mjs"
  "multimodal/vision.mjs"
  "images/generate.mjs"
)

# Run each example (assumes running from project root)
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/scripts/xai/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1 # Brief pause to respect rate limits
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All xAI examples passed!"
else
  echo "❌ The following xAI examples failed: $FAILED"
  exit 1
fi
