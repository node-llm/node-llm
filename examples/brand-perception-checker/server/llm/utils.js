/**
 * Technical tracing for audit logs.
 */
export function logExecutionStep(step, detail) {
  console.log(`[Audit] ${step.toUpperCase()}: ${detail}`);
}
