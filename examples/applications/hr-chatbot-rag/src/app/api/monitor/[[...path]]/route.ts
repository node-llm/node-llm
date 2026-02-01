import { createMonitoringRouter } from "@node-llm/monitor/ui";
import { prisma } from "@/lib/db";

const { GET: monitorGET, POST: monitorPOST } = createMonitoringRouter(prisma, {
  basePath: "/api/monitor"
});

// Type assertion needed due to Response type differences between Next.js and undici-types
export const GET = monitorGET as any;
export const POST = monitorPOST as any;
