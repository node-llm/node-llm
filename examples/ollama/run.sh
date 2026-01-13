#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "❌ Ollama is not running. Please start Ollama first."
  echo "   Visit: https://ollama.ai"
  exit 1
fi

echo "✅ Ollama is running"
echo "Running Ollama examples..."

# Ollama examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/streaming.mjs"
  "chat/tools.mjs"
  "multimodal/vision.mjs"
  "discovery/list.mjs"
  "embeddings/similarity.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/ollama/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All Ollama examples passed!"
else
  echo "❌ The following Ollama examples failed: $FAILED"
  exit 1
fi
