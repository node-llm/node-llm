/**
 * AWS Bedrock Provider Configuration
 *
 * Supports two authentication modes:
 * 1. API Key (Bearer token) - Simplest, for long-term API keys
 * 2. SigV4 (IAM credentials) - For EC2/ECS/Lambda with IAM roles
 */

export interface BedrockConfig {
  /**
   * AWS Region where Bedrock is enabled.
   * Example: "us-east-1", "us-west-2"
   */
  region: string;

  // ─────────────────────────────────────────────────────────────────────
  // Auth Option 1: API Key (Bearer token)
  // ─────────────────────────────────────────────────────────────────────
  /**
   * Long-term API key generated from AWS Bedrock console.
   * When provided, uses simple Bearer token authentication.
   * Mutually exclusive with accessKeyId/secretAccessKey.
   */
  apiKey?: string;

  // ─────────────────────────────────────────────────────────────────────
  // Auth Option 2: SigV4 (IAM credentials)
  // ─────────────────────────────────────────────────────────────────────
  /**
   * AWS Access Key ID.
   * Required when using SigV4 authentication (no apiKey).
   */
  accessKeyId?: string;

  /**
   * AWS Secret Access Key.
   * Required when using SigV4 authentication (no apiKey).
   */
  secretAccessKey?: string;

  /**
   * AWS Session Token (optional).
   * Required for temporary credentials from STS, SSO, or assumed roles.
   */
  sessionToken?: string;

  // ─────────────────────────────────────────────────────────────────────
  // Optional Settings
  // ─────────────────────────────────────────────────────────────────────
  /**
   * Request timeout in milliseconds.
   * Default: 120000 (2 minutes)
   */
  requestTimeout?: number;

  /**
   * Default Bedrock Guardrail identifier (ID or ARN).
   */
  guardrailIdentifier?: string;

  /**
   * Default Bedrock Guardrail version (e.g., "1", "DRAFT").
   */
  guardrailVersion?: string;
}

/**
 * Validates the configuration and determines the auth mode.
 */
export function validateBedrockConfig(config: BedrockConfig): "apiKey" | "sigv4" {
  if (!config.region) {
    throw new Error("BedrockConfig: region is required");
  }

  const hasApiKey = !!config.apiKey;
  const hasSigV4 = !!(config.accessKeyId && config.secretAccessKey);

  if (hasApiKey && hasSigV4) {
    throw new Error(
      "BedrockConfig: provide either apiKey OR accessKeyId/secretAccessKey, not both"
    );
  }

  if (hasApiKey) {
    return "apiKey";
  }

  if (hasSigV4) {
    return "sigv4";
  }

  throw new Error("BedrockConfig: provide either apiKey OR accessKeyId/secretAccessKey");
}

/**
 * Build the Bedrock Runtime endpoint URL for a given region.
 */
export function getBedrockEndpoint(region: string): string {
  return `https://bedrock-runtime.${region}.amazonaws.com`;
}
