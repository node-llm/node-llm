import { createMonitoringRouter } from "@node-llm/monitor/ui";
import { prisma } from "@/lib/db";

const { GET: monitorGET, POST: monitorPOST } = createMonitoringRouter(prisma, {
  basePath: "/api/monitor"
});

export const GET = monitorGET;
export const POST = monitorPOST;
