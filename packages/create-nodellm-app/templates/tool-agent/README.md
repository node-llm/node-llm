# NodeLLM tool agent

A command-line support agent that answers questions and calls a tool (`get_order_status`) when it needs data.

```bash
npm install
cp .env.example .env   # set NODELLM_PROVIDER and your API key
npm start
```

Add your own tools by writing more `Tool` classes in `index.js` and passing them to `.withTool(...)`.

Docs: https://nodellm.dev/core-features/tools
