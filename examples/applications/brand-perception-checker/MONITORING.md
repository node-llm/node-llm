# Monitoring Setup

This application uses `@node-llm/monitor` with a **file-based adapter** for observability.

## Features

- **Automatic Tracking**: All LLM operations are automatically monitored via middleware
- **File-Based Storage**: No database required - monitoring data is stored in JSON files
- **Dashboard UI**: Access the monitoring dashboard at `http://localhost:3001/monitor`
- **Global Configuration**: Monitoring middleware applies to all LLM instances

## Accessing the Dashboard

Once the server is running, visit:
```
http://localhost:3001/monitor
```

The dashboard provides:
- Real-time request traces
- Token usage and cost metrics
- Provider/model breakdown
- Performance analytics
- Time-series visualizations

## Storage Location

Monitoring data is stored in:
```
examples/applications/brand-perception-checker/monitoring-data/
```

This directory is gitignored and will be created automatically on first use.

## Configuration

### Monitoring Middleware (`server/llm/monitoring.js`)
```javascript
export const monitorMiddleware = createFileMonitor({
  directory: monitoringDir,
  captureContent: true
});
```

### Applied Globally (`server/llm/middlewares.js`)
```javascript
export const productionMiddlewares = [
  monitorMiddleware
];
```

### Used in Agent (`server/llm/agent.js`)
```javascript
const chat = systemAuditCore
  .chat(model, { middlewares: productionMiddlewares })
  // ...
```

## What's Being Tracked

- ✅ All OpenAI requests (gpt-4o, etc.)
- ✅ All Anthropic requests (Claude models)
- ✅ Token usage and costs
- ✅ Request/response timing
- ✅ Tool executions (SerpTool)
- ✅ Errors and failures
- ✅ Multi-turn conversations
- ✅ Structured output parsing

## Data Format

The FileAdapter stores events in JSONL format (one JSON object per line):
```bash
cat monitoring-data/events.jsonl | jq
```

Each event includes:
- Event type (request.start, request.end, etc.)
- Request ID and session ID
- Provider and model information
- Timing and performance metrics
- Token usage and costs
- Full request/response payload (if captureContent: true)
