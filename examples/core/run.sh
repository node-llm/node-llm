#!/bin/bash
set -e

# Build the package first
echo "Building package..."
cd packages/core && npm run build
cd ../..

echo "Running Core examples..."

# Core examples
EXAMPLES=(
  "custom-provider.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/core/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All Core examples passed!"
else
  echo "❌ The following Core examples failed: $FAILED"
  exit 1
fi
