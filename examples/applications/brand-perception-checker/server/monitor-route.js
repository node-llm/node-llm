/**
 * Monitor Dashboard Route
 * 
 * Provides the monitoring UI for viewing LLM operations.
 */

import { createMonitoringRouter } from "@node-llm/monitor/ui";
import { FileAdapter } from "@node-llm/monitor/adapters/filesystem";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const monitoringDir = join(__dirname, "../../monitoring-data");

// Create the monitoring router with file adapter
const fileAdapter = new FileAdapter({ directory: monitoringDir });

export const { GET: monitorGET, POST: monitorPOST } = createMonitoringRouter(fileAdapter, {
  basePath: "/monitor"
});
