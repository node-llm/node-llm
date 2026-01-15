/**
 * Pure business logic for the Brand Auditor.
 * Separated for easy unit testing.
 */

export function calculateAlignment(aiPerception, marketAudit) {
  const defaults = {
    consensusVibe: 'Unknown',
    divergence: 'Low',
    keyGap: 'None identified'
  };

  if (!aiPerception || !Array.isArray(aiPerception)) return defaults;

  try {
    const validModels = aiPerception.filter(p => !p.error);
    const tones = validModels.map(p => p.sentiment).filter(Boolean);
    
    let consensusVibe = 'Unknown';
    if (tones.length > 0) {
      const positiveCount = tones.filter(t => t.toLowerCase().includes('positive')).length;
      consensusVibe = positiveCount > tones.length / 2 ? 'Positive' : 'Neutral';
    }
    
    const uniqueSentiments = [...new Set(tones)];
    let divergence = 'Low';
    if (uniqueSentiments.length > 2) divergence = 'High';
    else if (uniqueSentiments.length > 1) divergence = 'Medium';
    
    const keyGap = marketAudit?.risk_signals?.length > 0 ? marketAudit.risk_signals[0] : 'None identified';

    return {
      consensusVibe,
      divergence,
      keyGap
    };
  } catch (err) {
    return defaults;
  }
}

export function createResilientIntrinsicFallback(provider, model, errorMsg) {
  return { 
    provider, 
    model, 
    error: true, 
    sentiment: 'Unknown',
    positioning: 'Error',
    core_values: ['Analysis failed'], 
    risk_mentions: [errorMsg] 
  };
}
