# Determine script and root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Build the package from root
echo "Building package..."
cd "$ROOT_DIR"
npm run build --workspace=@node-llm/core

# Get API Key from root .env
ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" "$ROOT_DIR/.env" | cut -d '=' -f2 || echo "")
export ANTHROPIC_API_KEY
export NODELLM_PROVIDER=anthropic

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
  if ! node "examples/scripts/anthropic/$ex"; then
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
