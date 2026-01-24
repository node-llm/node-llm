/**
 * AWS Signature Version 4 (SigV4) Request Signing Utility
 *
 * This is a minimal, focused implementation for signing AWS API requests.
 * It uses only Node.js native `crypto` module — no AWS SDK dependencies.
 *
 * Reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/create-signed-request.html
 */

import { createHmac, createHash } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string; // Required for temporary credentials (STS, SSO, etc.)
}

export interface SignRequestOptions {
  method: "POST" | "GET";
  url: string; // Full URL, e.g., https://bedrock-runtime.us-east-1.amazonaws.com/model/.../converse
  body: string; // JSON string (or empty string for GET)
  credentials: AwsCredentials;
  region: string; // e.g., "us-east-1"
  service: string; // e.g., "bedrock"
  timestamp?: Date; // Optional: for deterministic testing
}

export interface SignedHeaders {
  host: string;
  "x-amz-date": string;
  "x-amz-content-sha256": string;
  authorization: string;
  "x-amz-security-token"?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ALGORITHM = "AWS4-HMAC-SHA256";
const AWS4_REQUEST = "aws4_request";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SHA256 hash of a string, returned as hex.
 */
function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * HMAC-SHA256, returns raw bytes (Buffer).
 */
function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

/**
 * HMAC-SHA256, returns hex string.
 */
function hmacSha256Hex(key: Buffer | string, data: string): string {
  return createHmac("sha256", key).update(data, "utf8").digest("hex");
}

/**
 * Format a Date as AWS timestamp: YYYYMMDD'T'HHMMSS'Z'
 */
function formatAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/**
 * Extract just the date portion: YYYYMMDD
 */
function formatDateOnly(amzDate: string): string {
  return amzDate.substring(0, 8);
}

/**
 * Parse host from URL.
 */
function extractHost(url: string): string {
  const parsed = new URL(url);
  return parsed.host;
}

/**
 * Parse path from URL (without query string).
 */
function extractPath(url: string): string {
  const parsed = new URL(url);
  const path = parsed.pathname || "/";
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
    .replace(/%20/g, "%20") // encodeURIComponent already does %20
    .replace(/'/g, "%27") // AWS expects single quotes encoded
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Signing Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 4: Derive the signing key.
 *
 * kSecret  = "AWS4" + secretAccessKey
 * kDate    = HMAC-SHA256(kSecret, dateStamp)
 * kRegion  = HMAC-SHA256(kDate, region)
 * kService = HMAC-SHA256(kRegion, service)
 * kSigning = HMAC-SHA256(kService, "aws4_request")
 */
function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Buffer {
  const kSecret = "AWS4" + secretAccessKey;
  const kDate = hmacSha256(kSecret, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, AWS4_REQUEST);
  return kSigning;
}

/**
 * Step 2: Build the canonical request string.
 *
 * Format:
 *   HTTPMethod
 *   CanonicalURI
 *   CanonicalQueryString (empty for us)
 *   CanonicalHeaders
 *   (blank line)
 *   SignedHeaders
 *   HashedPayload
 */
function buildCanonicalRequest(
  method: string,
  path: string,
  headers: Record<string, string>,
  signedHeadersList: string[],
  payloadHash: string
): string {
  // Sort headers alphabetically
  const sortedHeaders = signedHeadersList.sort();

  // Build canonical headers: each line is "lowercase-key:trimmed-value\n"
  const canonicalHeaders = sortedHeaders
    .map((key) => `${key}:${(headers[key] ?? "").trim()}`)
    .join("\n");

  // Signed headers: semicolon-separated list
  const signedHeaders = sortedHeaders.join(";");

  return [
    method,
    path,
    "", // Query string (empty)
    canonicalHeaders + "\n", // Must end with newline
    signedHeaders,
    payloadHash
  ].join("\n");
}

/**
 * Step 3: Build the string to sign.
 *
 * Format:
 *   Algorithm
 *   RequestDateTime
 *   CredentialScope
 *   HashedCanonicalRequest
 */
function buildStringToSign(
  amzDate: string,
  credentialScope: string,
  canonicalRequest: string
): string {
  const hashedCanonicalRequest = sha256Hex(canonicalRequest);
  return [ALGORITHM, amzDate, credentialScope, hashedCanonicalRequest].join("\n");
}

/**
 * Step 6: Build the Authorization header value.
 */
function buildAuthorizationHeader(
  accessKeyId: string,
  credentialScope: string,
  signedHeaders: string,
  signature: string
): string {
  return `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign an AWS API request using SigV4.
 *
 * @param options - The request details and credentials
 * @returns Headers to include in the HTTP request
 *
 * @example
 * ```ts
 * const headers = signRequest({
 *   method: "POST",
 *   url: "https://bedrock-runtime.us-east-1.amazonaws.com/model/.../converse",
 *   body: JSON.stringify({ messages: [...] }),
 *   credentials: { accessKeyId: "...", secretAccessKey: "..." },
 *   region: "us-east-1",
 *   service: "bedrock"
 * });
 *
 * fetch(url, { headers: { ...headers, "Content-Type": "application/json" }, body });
 * ```
 */
export function signRequest(options: SignRequestOptions): SignedHeaders {
  const { method, url, body, credentials, region, service, timestamp } = options;

  // Timestamps (use provided timestamp for testing, or current time)
  const now = timestamp ?? new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = formatDateOnly(amzDate);

  // Step 1: Hash the payload
  const payloadHash = sha256Hex(body);

  // Extract URL components
  const host = extractHost(url);
  const path = extractPath(url);

  // Build headers to sign (sorted alphabetically)
  const headersToSign: Record<string, string> = {
    host: host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };

  // Add session token if present
  if (credentials.sessionToken) {
    headersToSign["x-amz-security-token"] = credentials.sessionToken;
  }

  const signedHeadersList = Object.keys(headersToSign);

  // Step 2: Canonical Request
  const canonicalRequest = buildCanonicalRequest(
    method,
    path,
    headersToSign,
    signedHeadersList,
    payloadHash
  );

  // Credential scope: date/region/service/aws4_request
  const credentialScope = `${dateStamp}/${region}/${service}/${AWS4_REQUEST}`;

  // Step 3: String to Sign
  const stringToSign = buildStringToSign(amzDate, credentialScope, canonicalRequest);

  // Step 4: Signing Key
  const signingKey = deriveSigningKey(credentials.secretAccessKey, dateStamp, region, service);

  // Step 5: Signature
  const signature = hmacSha256Hex(signingKey, stringToSign);

  // Step 6: Authorization Header
  const signedHeaders = signedHeadersList.sort().join(";");
  const authorization = buildAuthorizationHeader(
    credentials.accessKeyId,
    credentialScope,
    signedHeaders,
    signature
  );

  // Build final headers
  const result: SignedHeaders = {
    host: host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    authorization: authorization
  };

  if (credentials.sessionToken) {
    result["x-amz-security-token"] = credentials.sessionToken;
  }

  return result;
}
