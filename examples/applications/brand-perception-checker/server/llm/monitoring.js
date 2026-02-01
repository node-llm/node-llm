/**
 * Global Monitoring Setup
 * 
 * Configures file-based monitoring for all LLM operations.
 */

import { createFileMonitor } from "@node-llm/monitor";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Store monitoring data in a dedicated directory
const monitoringDir = join(__dirname, "../../monitoring-data");

// Create monitor middleware using file adapter
export const monitorMiddleware = createFileMonitor({
  directory: monitoringDir,
  captureContent: true
});

console.log(`[Monitor] File-based monitoring initialized at: ${monitoringDir}`);
