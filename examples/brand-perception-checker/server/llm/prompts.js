/**
 * Intrinsic Analysis Prompt
 */
export const INTRINSIC_ANALYSIS_PROMPT = (brandName) => `
Perform a latent training-data analysis for "${brandName}". 
Provide a semantic profile covering market positioning, risk vectors, and core values.
IMPORTANT: Return ONLY a valid JSON object matching the schema. No conversational text.
`;

/**
 * Market Data Synthesis Prompt
 */
export const MARKET_SYNTHESIS_PROMPT = (brandName) => `
Research "${brandName}" using search_market_data. 
Analyze the tool results and synthesize a report matching the schema.
Strictly output JSON with keys: dominant_themes, paa, risk_signals, trending_news.
`;

/**
 * Streaming Narrative Prompt
 */
export const STREAMING_NARRATIVE_PROMPT = (brandName) => `
PROTOCOL_AUDIT_SCOPE: Technical Brand Architect & Auditor. 
TASK: Perform semantic trace on "${brandName}" across infrastructure reliability and market presence. 
OUTPUT_FORMAT: Sequential reasoning follow by finalized JSON structure.
`;

/**
 * System Instructions
 */
export const MARKET_ANALYST_INSTRUCTIONS = `
DIRECTIVE: Market Data Synthesis Analyst. 
Research the brand using tools, then synthesize findings into a flat JSON object. 
Ensure you extract the actual URLs from the search results for the trending_news section.
`;
