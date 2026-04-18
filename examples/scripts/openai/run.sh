# Determine script and root directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Build the package from root
echo "Building package..."
cd "$ROOT_DIR"
npm run build --workspace=@node-llm/core

# Get API Key from root .env
OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" "$ROOT_DIR/.env" | cut -d '=' -f2 || echo "")
export OPENAI_API_KEY
export NODELLM_PROVIDER=openai

echo "Found API Key: ${OPENAI_API_KEY:0:5}..."

# List of normalized OpenAI examples
EXAMPLES=(
  "chat/basic.mjs"
  "chat/instructions.mjs"
  "chat/tools.mjs"
  "chat/tool-choice.mjs"
  "chat/raw-json.mjs"
  "chat/streaming.mjs"
  "chat/streaming-tools.mjs"
  "chat/events.mjs"
  "chat/usage.mjs"
  "chat/reasoning.mjs"
  "chat/parallel-tools.mjs"
  "chat/params.mjs"
  "chat/structured.mjs"
  "chat/max-tokens.mjs"
  "multimodal/vision.mjs"
  "multimodal/multi-image.mjs"
  "multimodal/files.mjs"
  "multimodal/transcribe.mjs"
  "images/generate.mjs"
  "safety/moderation.mjs"
  "discovery/models.mjs"
  "embeddings/create.mjs"
  "security/configuration.mjs"
  "security/request-timeout.mjs"
  "security/content-policy-hooks.mjs"
  "security/tool-policies.mjs"
  "core/configuration.mjs"
  "core/support-agent.mjs"
  "core/parallel-scoring.mjs"
  "core/custom-endpoints.mjs"
)

# Run each example (assumes running from project root)
FAILED=""
for ex in "${EXAMPLES[@]}"; do
  echo "----------------------------------------------------"
  echo "Running: $ex"
  echo "----------------------------------------------------"
  if ! node "examples/scripts/openai/$ex"; then
    echo "FAILED: $ex"
    FAILED="$FAILED $ex"
  fi
  echo ""
  sleep 1 # Brief pause to respect rate limits
done

echo "----------------------------------------------------"
if [ -z "$FAILED" ]; then
  echo "✅ All OpenAI examples passed!"
else
  echo "❌ The following OpenAI examples failed: $FAILED"
  exit 1
fi
