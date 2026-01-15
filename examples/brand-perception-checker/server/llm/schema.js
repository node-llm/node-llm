import { z } from '@node-llm/core';

export const PerceptionSchema = z.object({
  tone: z.string(),
  sentiment: z.enum(['very positive', 'positive', 'neutral', 'negative']),
  positioning: z.enum(['leader', 'alternative', 'emerging']),
  core_values: z.array(z.string()),
  perceived_competitors: z.array(z.string()),
  risk_mentions: z.array(z.string()),
  description: z.string()
});

export const MarketSchema = z.object({
  visibility: z.string().describe('Overall search visibility score/level (e.g. high, medium, low)'),
  sentiment_trend: z.string().describe('Direction of market sentiment (e.g. rising, stable)'),
  market_presence: z.enum(['dominant', 'strong', 'average', 'niche']).describe('Relative position in the ecosystem'),
  dominant_themes: z.array(z.string()).describe('List of 3-5 key themes found in organic results'),
  paa: z.array(z.string()).describe('Relevant "People Also Ask" questions found'),
  competitor_proximity: z.array(z.string()).describe('Competitors appearing frequently in the same context'),
  risk_signals: z.array(z.string()).describe('Potential market risks identified from snippets'),
  trending_news: z.array(z.object({
    title: z.string(),
    link: z.string(),
    source: z.string().describe('The publisher or website name (e.g. Reddit, News18). Derive from URL if needed.')
  })).describe('Latest news/blogs. EXTRACT 3-5 actual links from organic results.')
});
