#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# The resource's key and address, and the deployments to use
for name in AZURE_API_KEY AZURE_API_BASE AZURE_MODEL AZURE_EMBEDDING_MODEL; do
  value=$(grep "^$name=" .env | cut -d '=' -f2-)
  [ -n "$value" ] && export "$name=$value"
done
export NODELLM_PROVIDER=azure

if [ -z "$AZURE_API_KEY" ] || [ -z "$AZURE_API_BASE" ]; then
  echo "Set AZURE_API_KEY and AZURE_API_BASE in .env"
  exit 1
fi

echo "Found API Key: ${AZURE_API_KEY:0:5}..."

# List of Azure examples
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
  if ! node "examples/scripts/azure/$example"; then
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
