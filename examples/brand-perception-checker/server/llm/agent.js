import { systemAuditCore, anthropic } from './providers.js';
import { PerceptionSchema, MarketSchema } from './schema.js';
import { SerpTool } from './tools/serp.tool.js';
import { logExecutionStep } from './utils.js';
import { calculateAlignment, createResilientIntrinsicFallback } from './logic.js';
import { 
  INTRINSIC_ANALYSIS_PROMPT, 
  MARKET_SYNTHESIS_PROMPT, 
  STREAMING_NARRATIVE_PROMPT, 
  MARKET_ANALYST_INSTRUCTIONS 
} from './prompts.js';

/**
 * Stage 1: Intrinsic Latent Analysis
 * Queries multiple providers without external tools to extract training-data weights.
 */
export async function getIntrinsicPerception(brandName) {
  logExecutionStep('tracing', `Starting latent analysis for ${brandName}`);
  
  const entries = [
    { provider: 'openai', model: 'gpt-4o', instance: systemAuditCore },
    { provider: 'anthropic', model: 'claude-haiku-3', instance: anthropic },
  ];

  const results = await Promise.all(
    entries.map(async (m) => {
      try {
        const chat = m.instance.chat(m.model)
          .withSchema(PerceptionSchema)
          .withTemperature(0);
        
        const response = await chat.ask(INTRINSIC_ANALYSIS_PROMPT(brandName));
        const parsed = response.parsed || {};
        return {
          provider: m.provider,
          model: m.model,
          sentiment: 'neutral',
          positioning: 'emerging',
          core_values: [],
          risk_mentions: [],
          ...parsed,
          usage: response.usage
        };
      } catch (err) {
        console.error(`[Audit] NODE_FAILURE: ${m.model} - ${err.message}`);
        return createResilientIntrinsicFallback(m.provider, m.model, err.message);
      }
    })
  );

  return results.filter(r => !r.error);
}

/**
 * Stage 2: Synthesis Agent
 * Orchestrates tools to validate latent data against live market telemetry.
 */
export async function getMarketAudit(brandName) {
  logExecutionStep('agent_spawn', `Initializing Market Data Synthesis Analyst`);
  
  try {
    const chat = systemAuditCore.chat('gpt-4o')
      .withInstructions(MARKET_ANALYST_INSTRUCTIONS)
      .withSchema(MarketSchema)
      .withTemperature(0)
      .withTool(new SerpTool())
      .onToolCallStart((call) => logExecutionStep('tool_call', call.function.name))
      .withToolExecution('auto');

    const response = await chat.ask(MARKET_SYNTHESIS_PROMPT(brandName));
    let parsed = response.parsed || {};
    
    // 1. Auto-flatten if the model nested the response under an arbitrary key
    const wrapperKey = Object.keys(parsed).find(k => typeof parsed[k] === 'object' && !Array.isArray(parsed[k]));
    if (wrapperKey && (parsed[wrapperKey].visibility || parsed[wrapperKey].dominant_themes || parsed[wrapperKey].organicMentions)) {
      parsed = parsed[wrapperKey];
    }
    
    return {
      visibility: 'unknown',
      sentiment_trend: 'stable',
      market_presence: 'average',
      dominant_themes: [],
      paa: [],
      competitor_proximity: [],
      risk_signals: [],
      trending_news: [],
      ...parsed,
      _audit_trail: {
        usage: response.usage,
        timestamp: new Date().toISOString()
      }
    };
  } catch (err) {
    console.error(`[Agent] FATAL_SYSTEM_ERROR: ${err.message}`);
    // Return resilient fallback instead of crashing
    return {
      visibility: 'Analysis Failed',
      sentiment_trend: 'Unknown',
      market_presence: 'Unknown',
      dominant_themes: ['System Error'],
      paa: [],
      competitor_proximity: [],
      risk_signals: ['System error during market analysis'],
      trending_news: [],
      error: err.message
    };
  }
}

/**
 * Live Narrative Stream
 * Provides real-time reasoning trace for the dashboard.
 */
export async function* getAuditStream(brandName) {
  const chat = systemAuditCore.chat('gpt-4o')
    .withInstructions(STREAMING_NARRATIVE_PROMPT(brandName));

  const stream = chat.stream(`Begin continuous analysis of ${brandName}...`);

  for await (const chunk of stream) {
    if (chunk.type === 'content') {
      yield chunk.content;
    }
  }
}

/**
 * Full Strategy Audit
 * Orchestrates multiple semantic nodes and live telemetry to generate a finalized report.
 */
export async function auditBrand(brandName) {
  logExecutionStep('orchestration', `Commencing full system audit for "${brandName}"`);
  
  const [aiPerception, marketAudit] = await Promise.all([
    getIntrinsicPerception(brandName),
    getMarketAudit(brandName)
  ]);

  const { consensusVibe, divergence, keyGap } = calculateAlignment(aiPerception, marketAudit);

  return {
    brandName,
    timestamp: new Date().toISOString(),
    ai_perception: {
      consensus: consensusVibe,
      confidence: aiPerception.length > 0 ? 'High' : 'Low',
      provider_disagreement: divergence,
      models: aiPerception
    },
    market_perception: marketAudit,
    alignment: {
      ai_vs_market: 'Aligned',
      key_gap: keyGap
    }
  };
}
