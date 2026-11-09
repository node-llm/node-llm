# NodeLLM streaming API

A dependency-free HTTP server: `POST /chat` streams the model's answer as Server-Sent Events. Switch providers in `.env`, not in code.

```bash
npm install
cp .env.example .env   # set NODELLM_PROVIDER and your API key
npm start

curl -N -X POST localhost:3000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Tell me a joke"}'
```

Docs: https://nodellm.dev/core-features/streaming.html
