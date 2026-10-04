import { apiRequest } from "./client";
import type { EventType, TemplateOption } from "./types";

export function listTemplates(eventType?: EventType, signal?: AbortSignal) {
  const query = eventType ? `?eventType=${eventType}` : "";
  return apiRequest<TemplateOption[]>(`/api/v1/templates${query}`, { signal });
}
