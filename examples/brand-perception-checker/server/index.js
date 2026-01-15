import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { auditBrand, getAuditStream } from './llm.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

/**
 * Audit Endpoint
 * Primary entry point for brand perception diagnostics.
 */
app.post('/analyze', async (req, res) => {
  const { brandName } = req.body;
  if (!brandName) {
    return res.status(400).json({ error: 'SYSTEM_ERROR: brandName is required' });
  }

  try {
    const report = await auditBrand(brandName);
    res.json(report);
  } catch (error) {
    console.error('[Controller] AUDIT_FAILURE:', error);
    res.status(500).json({ error: 'INTERNAL_SYSTEM_FAILURE during audit trace' });
  }
});

/**
 * Live Narrative Endpoint (Optional for dashboard)
 */
app.get('/stream', async (req, res) => {
  const { brandName } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = getAuditStream(brandName);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
  res.end();
});

app.get('/health', (req, res) => res.json({ status: 'operational' }));

app.listen(port, () => {
  const missingKeys = [];
  if (!process.env.OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY');
  if (!process.env.SERPER_API_KEY) missingKeys.push('SERPER_API_KEY');

  if (missingKeys.length > 0) {
    console.error('\n\x1b[31m%s\x1b[0m', '────────────────────────────────────────────────────────────');
    console.error('\x1b[31m%s\x1b[0m', ' ❌ SYSTEM BOOT FAILURE: Missing Environment Variables');
    console.error('\x1b[31m%s\x1b[0m', '────────────────────────────────────────────────────────────');
    console.error('The following keys are required in examples/brand-perception-checker/server/.env:');
    missingKeys.forEach(k => console.error(` - ${k}`));
    console.error('\nPlease copy .env.example to .env and add your keys.');
    process.exit(1);
  }

  console.log(`[System] Multi-Provider Auditor running on port ${port}`);
});
