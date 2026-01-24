#!/bin/bash
# Run Bedrock examples
# Make sure you have AWS_BEARER_TOKEN_BEDROCK and AWS_REGION set in .env

cd "$(dirname "$0")"

echo "================================"
echo "Bedrock Examples"
echo "================================"
echo ""

# Load .env from project root if it exists
if [ -f "../../../.env" ]; then
  set -a
  source "../../../.env"
  set +a
fi

# Check for required env vars
if [ -z "$AWS_BEARER_TOKEN_BEDROCK" ] && [ -z "$AWS_ACCESS_KEY_ID" ]; then
  echo "Error: AWS credentials not set."
  echo "Set either AWS_BEARER_TOKEN_BEDROCK or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY"
  exit 1
fi

if [ -z "$AWS_REGION" ]; then
  echo "Warning: AWS_REGION not set, defaulting to us-east-1"
fi

echo "Running basic chat example..."
node chat/basic.mjs
echo ""

echo "Running discovery example..."
node discovery/models.mjs
echo ""

echo "Running instructions example..."
node chat/instructions.mjs
echo ""

echo "Running max-tokens example..."
node chat/max-tokens.mjs
echo ""

echo "Running params example..."
node chat/params.mjs
echo ""

echo "Running usage example..."
node chat/usage.mjs
echo ""

echo "Running tools example..."
node chat/tools.mjs
echo ""

echo "Running streaming example..."
node chat/streaming.mjs
echo ""

echo "Running Nova specific tests..."
node chat/nova.mjs
echo ""

echo "Running vision example..."
node chat/vision.mjs
echo ""

echo "Running thinking example..."
node chat/thinking.mjs
echo ""

echo "Running guardrails example..."
node chat/guardrails.mjs
echo ""

echo "Running embeddings example..."
node embeddings/basic.mjs
echo ""

echo "Running image generation example..."
node image/titan.mjs
echo ""

echo "================================"
echo "All Bedrock examples completed!"
echo "================================"
