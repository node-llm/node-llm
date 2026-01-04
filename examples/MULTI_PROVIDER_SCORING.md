# Multi-Provider Parallel Scoring Example

## What This Demonstrates

This example shows **your exact use case**: 
- Accept a student answer as input
- Call 3 different LLM providers in parallel (OpenAI, Anthropic, Gemini)
- Each scores the answer from 1-10
- Average the scores for consensus-based grading

## Does It Work?

**YES! ✅** This works with the current `node-llm` API.

## Running the Example

```bash
# Set your API keys
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# Run
node examples/multi-provider-scoring.mjs
```

## Sample Output

```
📚 MULTI-PROVIDER ANSWER SCORING
================================================================================

📝 Question: What is photosynthesis and why is it important for life on Earth?

💬 Student Answer: Photosynthesis is the process by which plants convert sunlight...

================================================================================

⏳ Calling all providers in parallel...

🤖 OPENAI (gpt-4o-mini)
   Score: 9
   Reason: Accurately describes photosynthesis with key components...

🤖 ANTHROPIC (claude-3-5-haiku-20241022)
   Score: 8
   Reason: Solid, concise explanation with correct scientific principles...

🤖 GEMINI (gemini-2.0-flash-exp)
   Score: 8
   Reason: Good coverage of inputs, outputs, and importance...

================================================================================

📊 INDIVIDUAL SCORES: 9, 8, 8
⭐ AVERAGE SCORE: 8.3/10

✅ Successfully scored answer using 3 providers in parallel!
```

## How It Works

```javascript
// 1. Configure all providers
NodeLLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.geminiApiKey = process.env.GEMINI_API_KEY;
});

// 2. Function to score with a specific provider
async function scoreWithProvider(provider, model, question, answer) {
  NodeLLM.configure({ provider });  // Switch provider
  const chat = NodeLLM.chat(model);
  const response = await chat.ask(scoringPrompt);
  return parseScore(response);
}

// 3. Call all providers in parallel
const results = await Promise.all([
  scoreWithProvider("openai", "gpt-4o-mini", q, a),
  scoreWithProvider("anthropic", "claude-3-5-haiku", q, a),
  scoreWithProvider("gemini", "gemini-2.0-flash", q, a),
]);

// 4. Average the scores
const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
```

## The Question

> "Does that work with current node-llm?"

**Answer: YES!** ✅

The example proves it works. Now we can discuss if we want to improve the API to make it even cleaner (remove potential race conditions, make it more explicit, etc.).

## Next Steps

This example works, but there are ways to make the API better for this use case:

1. **Keep current approach** - Works, but has theoretical race condition risk
2. **Remove singleton** - Create separate instances per provider (cleaner)
3. **Stateless design** - Pass provider on each call (most flexible)

We can decide which direction to take based on your needs!
