#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Get API Key
MISTRAL_API_KEY=$(grep "^MISTRAL_API_KEY=" .env | cut -d '=' -f2)
export MISTRAL_API_KEY
export NODELLM_PROVIDER=mistral

echo "Found API Key: ${MISTRAL_API_KEY:0:5}..."

# List of Mistral examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/streaming.mjs"
  "chat/tools.mjs"
  "chat/structured.mjs"
  "embeddings/create.mjs"
  "discovery/models.mjs"
)

# Run each example (assumes running from project root)
FAILED=""
for example in "${EXAMPLES[@]}"; do
  echo ""
  echo "=========================================="
  echo "Running: $example"
  echo "=========================================="
  if ! node "examples/scripts/mistral/$example"; then
    FAILED="$FAILED $example"
    echo "FAILED: $example"
  fi
done

echo ""
echo "=========================================="
if [ -n "$FAILED" ]; then
  echo "FAILED EXAMPLES:$FAILED"
  exit 1
else
  echo "All examples completed successfully!"
fi
