# NodeLLM scheduled summarizer

A background job that reads text files from `./inbox` and turns each into structured data (title, summary, action items, sentiment) validated by a Zod schema.

```bash
npm install
cp .env.example .env   # set NODELLM_PROVIDER and your API key
npm run once           # one pass
npm start              # repeat every INTERVAL_MINUTES (default 60)
```

Docs: https://nodellm.dev/core-features/structured_output.html
