# create-nodellm-app

Start a [NodeLLM](https://nodellm.dev) project in one command.

```bash
npx create-nodellm-app my-agent
```

Pick a template when asked, or pass `--template`:

| Template          | What you get                                                                 |
| ----------------- | ---------------------------------------------------------------------------- |
| `tool-agent`      | A command-line agent that calls your own tools                               |
| `streaming-api`   | A dependency-free HTTP endpoint that streams answers as Server-Sent Events   |
| `cron-summarizer` | A scheduled job that turns text files into structured data with a Zod schema |

```bash
npx create-nodellm-app my-api --template streaming-api
cd my-api
npm install
cp .env.example .env   # choose a provider and add its API key
npm start
```

Add `--ts` to any template to generate TypeScript files instead:

```bash
npx create-nodellm-app my-agent --template tool-agent --ts
cd my-agent
npm install
npm run typecheck
cp .env.example .env   # choose a provider and add its API key
npm start
```

TypeScript projects use `tsx` to run `.ts` files on Node.js 20.10+.

Every template works with any provider NodeLLM supports (OpenAI, Anthropic, Gemini, DeepSeek, Bedrock, OpenRouter, xAI, Ollama, Mistral, Azure AI Foundry): switch with `NODELLM_PROVIDER` in `.env`.

Requires Node.js 20.10 or later.
