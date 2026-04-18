# Determine script and root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Build the package from root
echo "Building package..."
cd "$ROOT_DIR"
npm run build --workspace=@node-llm/core

# Get API Key from root .env
GEMINI_API_KEY=$(grep "^GEMINI_API_KEY=" "$ROOT_DIR/.env" | cut -d '=' -f2 || echo "")
export GEMINI_API_KEY
export NODELLM_PROVIDER=gemini

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
  "chat/raw-json.mjs"
  "chat/streaming.mjs"
  "chat/streaming-tools.mjs"
  "chat/events.mjs"
  "chat/usage.mjs"
  "chat/parallel-tools.mjs"
  "chat/max-tokens.mjs"
  "chat/structured.mjs"
  "chat/params.mjs"
  "multimodal/vision.mjs"
  "multimodal/multi-image.mjs"
  "multimodal/files.mjs"
  "multimodal/transcribe.mjs"
  "discovery/models.mjs"
  "embeddings/create.mjs"
)

# Run each example
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/scripts/gemini/$ex"; then
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
