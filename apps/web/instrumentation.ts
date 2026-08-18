import type { Instrumentation } from "next";
import { reportError } from "@/lib/monitoring/report-error";

// Captures errors from Server Components, Route Handlers, and Server Actions (blueprint §10
// Sentry wiring) — see lib/monitoring/report-error.ts for why this isn't the @sentry/nextjs SDK.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportError(error, { path: request.path, method: request.method, routeType: context.routeType });
};
