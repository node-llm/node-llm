import { Middleware, ChatResponseString } from "@node-llm/core";

/**
 * HR Chatbot Middleware Stack
 * 
 * Production-grade middlewares for the HR Policy Assistant.
 */

/**
 * Query Logging Middleware
 * Logs user queries for analytics and support
 */
export const queryLoggingMiddleware: Middleware = {
  name: "QueryLogger",
  
  onRequest: async (ctx) => {
    if (ctx.messages && ctx.messages.length > 0) {
      const lastMessage = ctx.messages[ctx.messages.length - 1];
      const content = typeof lastMessage.content === "string" 
        ? lastMessage.content 
        : String(lastMessage.content);
      
      console.log(`[HR Bot] Query: "${content.substring(0, 100)}..."`);
      
      // In production: store in analytics database
      // await analytics.track({
      //   requestId: ctx.requestId,
      //   query: content,
      //   timestamp: new Date()
      // });
    }
  },
  
  onResponse: async (ctx, response) => {
    if (response instanceof ChatResponseString) {
      console.log(
        `[HR Bot] Response generated (${response.usage?.total_tokens || 0} tokens)`
      );
    }
  }
};

/**
 * PII Detection Middleware
 * Detects and flags potential PII in user queries
 */
export const piiDetectionMiddleware: Middleware = {
  name: "PIIDetector",
  
  onRequest: async (ctx) => {
    const patterns = {
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
    };
    
    if (ctx.messages && ctx.messages.length > 0) {
      const lastMessage = ctx.messages[ctx.messages.length - 1];
      const content = typeof lastMessage.content === "string" 
        ? lastMessage.content 
        : String(lastMessage.content);
      
      const detected: string[] = [];
      Object.entries(patterns).forEach(([type, pattern]) => {
        if (pattern.test(content)) {
          detected.push(type);
        }
      });
      
      if (detected.length > 0) {
        console.warn(
          `[PII] Warning: Potential PII detected in request ${ctx.requestId}: ${detected.join(", ")}`
        );
        
        // In production: alert compliance team, log to audit trail
        // await compliance.logPIIDetected({
        //   requestId: ctx.requestId,
        //   types: detected
        // });
      }
    }
  }
};

/**
 * Performance Tracking Middleware
 * Monitors response times for SLA tracking
 */
export const performanceMiddleware: Middleware = {
  name: "PerformanceTracker",
  
  onRequest: async (ctx) => {
    (ctx as any)._start = Date.now();
  },
  
  onResponse: async (ctx, response) => {
    const duration = Date.now() - ((ctx as any)._start || 0);
    
    if (duration > 3000) {
      console.warn(
        `[Perf] SLOW RESPONSE: ${duration}ms (Request ${ctx.requestId})`
      );
    } else {
      console.log(`[Perf] Response time: ${duration}ms`);
    }
    
    // In production: send to monitoring system (DataDog, New Relic, etc.)
    // await monitoring.recordMetric("hr_bot_latency", duration);
  },
  
  onError: async (ctx, error) => {
    const duration = Date.now() - ((ctx as any)._start || 0);
    console.error(
      `[Perf] ERROR after ${duration}ms (Request ${ctx.requestId}):`,
      error.message
    );
    
    // In production: alert on-call engineer
    // await alerting.sendAlert({
    //   severity: "high",
    //   message: `HR Bot error: ${error.message}`
    // });
  }
};

/**
 * Response Quality Middleware
 * Ensures fallback message quality standards
 */
export const qualityMiddleware: Middleware = {
  name: "QualityChecker",
  
  onResponse: async (ctx, response) => {
    if (response instanceof ChatResponseString) {
      const content = response.content || "";

      // Check for "I don't know" type responses
      const uncertainPhrases = [
        "i don't have information",
        "i'm sorry, i don't",
        "contact the hr department",
        "not in my current registry"
      ];

      const isUncertain = uncertainPhrases.some((phrase) =>
        content.toLowerCase().includes(phrase)
      );

      if (isUncertain) {
        console.log(
          `[Quality] Fallback response triggered for request ${ctx.requestId}`
        );

        // In production: track fallback rate as a quality metric
        // await metrics.increment("hr_bot_fallback_responses");
      }
    }
  }
};

/**
 * Audit Trail Middleware
 * Creates comprehensive audit logs for compliance
 */
export const auditMiddleware: Middleware = {
  name: "AuditTrail",
  
  onRequest: async (ctx) => {
    const auditLog = {
      requestId: ctx.requestId,
      timestamp: new Date().toISOString(),
      provider: ctx.provider,
      model: ctx.model,
      operation: "hr_query",
      messageCount: ctx.messages?.length || 0
    };
    
    console.log("[Audit]", JSON.stringify(auditLog));
    
    // In production: store in immutable audit log (S3, CloudWatch, etc.)
    // await auditLog.store(auditLog);
  },
  
  onResponse: async (ctx, response) => {
    const auditLog: any = {
      requestId: ctx.requestId,
      timestamp: new Date().toISOString(),
      status: "success"
    };

    if (response instanceof ChatResponseString) {
      auditLog.tokens = response.usage?.total_tokens;
    }

    console.log("[Audit]", JSON.stringify(auditLog));
  },
  
  onError: async (ctx, error) => {
    const auditLog = {
      requestId: ctx.requestId,
      timestamp: new Date().toISOString(),
      status: "error",
      errorMessage: error.message
    };
    
    console.error("[Audit]", JSON.stringify(auditLog));
  }
};

/**
 * Combined middleware stack for HR chatbot
 */
export const hrChatbotMiddlewares: Middleware[] = [
  auditMiddleware,
  queryLoggingMiddleware,
  piiDetectionMiddleware,
  performanceMiddleware,
  qualityMiddleware
];
