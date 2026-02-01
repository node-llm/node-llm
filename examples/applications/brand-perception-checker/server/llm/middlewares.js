/**
 * Application Middlewares
 * 
 * Production-grade middlewares for monitoring, auditing, and compliance.
 */

/**
 * Request Logging Middleware
 * Logs all LLM requests with timing and usage metrics
 */
export const loggingMiddleware = {
  name: "RequestLogger",
  
  onRequest: async (ctx) => {
    console.log(`[LLM] Request ${ctx.requestId} to ${ctx.provider}/${ctx.model}`);
    ctx._startTime = Date.now();
  },
  
  onResponse: async (ctx, response) => {
    const duration = Date.now() - (ctx._startTime || 0);
    console.log(
      `[LLM] Response ${ctx.requestId}: ${response.usage?.total_tokens || 0} tokens in ${duration}ms`
    );
  },
  
  onError: async (ctx, error) => {
    const duration = Date.now() - (ctx._startTime || 0);
    console.error(`[LLM] Error ${ctx.requestId} after ${duration}ms:`, error.message);
  }
};

/**
 * Cost Tracking Middleware
 * Estimates and logs LLM API costs
 */
export const costTrackingMiddleware = {
  name: "CostTracker",
  
  // Simple pricing (update with real prices)
  pricing: {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "claude-haiku-3": { input: 0.00025, output: 0.00125 }
  },
  
  onResponse: async (ctx, response) => {
    const model = ctx.model || "unknown";
    const pricing = costTrackingMiddleware.pricing[model];
    
    if (pricing && response.usage) {
      const inputCost = (response.usage.input_tokens / 1000) * pricing.input;
      const outputCost = (response.usage.output_tokens / 1000) * pricing.output;
      const totalCost = inputCost + outputCost;
      
      console.log(
        `[Cost] Request ${ctx.requestId}: $${totalCost.toFixed(6)} ` +
        `(${response.usage.input_tokens} in + ${response.usage.output_tokens} out)`
      );
      
      // In production: store in database or send to analytics
    }
  }
};

/**
 * Error Recovery Middleware
 * Implements retry logic and fallback strategies
 */
export const errorRecoveryMiddleware = {
  name: "ErrorRecovery",
  
  onError: async (ctx, error) => {
    // Log for monitoring
    console.warn(`[Recovery] Handling error in ${ctx.requestId}:`, error.message);
    
    // In production: implement retry logic, provider fallback, etc.
    // For now, just log recovery attempt
    if (error.message.includes("rate limit")) {
      console.log("[Recovery] Rate limit detected - consider implementing exponential backoff");
    } else if (error.message.includes("timeout")) {
      console.log("[Recovery] Timeout detected - consider retrying with smaller context");
    }
  }
};

/**
 * Compliance Audit Middleware
 * Tracks all LLM interactions for compliance/audit trails
 */
export const complianceMiddleware = {
  name: "ComplianceAuditor",
  
  onRequest: async (ctx) => {
    const auditLog = {
      requestId: ctx.requestId,
      timestamp: new Date().toISOString(),
      provider: ctx.provider,
      model: ctx.model,
      operation: "llm_request"
    };
    
    // In production: send to audit log system (Elasticsearch, CloudWatch, etc.)
    console.log("[Audit]", JSON.stringify(auditLog));
  },
  
  onResponse: async (ctx, response) => {
    const auditLog = {
      requestId: ctx.requestId,
      timestamp: new Date().toISOString(),
      tokens: response.usage?.total_tokens,
      operation: "llm_response"
    };
    
    console.log("[Audit]", JSON.stringify(auditLog));
  }
};

/**
 * Performance Monitoring Middleware
 * Tracks slow requests and performance degradation
 */
export const performanceMiddleware = {
  name: "PerformanceMonitor",
  
  slowThreshold: 5000, // 5 seconds
  
  onRequest: async (ctx) => {
    ctx._perfStart = Date.now();
  },
  
  onResponse: async (ctx, response) => {
    const duration = Date.now() - (ctx._perfStart || 0);
    
    if (duration > performanceMiddleware.slowThreshold) {
      console.warn(
        `[Perf] SLOW REQUEST ${ctx.requestId}: ${duration}ms ` +
        `(${response.usage?.total_tokens || 0} tokens)`
      );
      
      // In production: alert monitoring system
    }
  }
};

/**
 * Combined middleware stack for production use
 */
export const productionMiddlewares = [
  loggingMiddleware,
  costTrackingMiddleware,
  performanceMiddleware,
  complianceMiddleware,
  errorRecoveryMiddleware
];
