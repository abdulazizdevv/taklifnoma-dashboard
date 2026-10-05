import { apiRequest } from "./client";
import type {
  CreatedInvitation,
  EventType,
  InvitationDetail,
  InvitationListResponse,
  UpdateInvitationPayload,
} from "./types";

export function listInvitations(accessToken: string, limit = 20, cursor?: number) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", String(cursor));
  return apiRequest<InvitationListResponse>(`/api/v1/invitations?${params.toString()}`, { accessToken });
}

export function createInvitation({
  accessToken,
  templateId,
  eventType,
}: {
  accessToken: string;
  templateId: number;
  eventType: EventType;
}) {
  return apiRequest<CreatedInvitation>("/api/v1/invitations", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ templateId, eventType }),
  });
}

export function getInvitation(accessToken: string, id: number) {
  return apiRequest<InvitationDetail>(`/api/v1/invitations/${id}`, { accessToken });
}

export function updateInvitation(accessToken: string, id: number, payload: UpdateInvitationPayload) {
  return apiRequest<InvitationDetail>(`/api/v1/invitations/${id}`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
}

export function submitInvitation(accessToken: string, id: number) {
  return apiRequest<CreatedInvitation>(`/api/v1/invitations/${id}/submit`, {
    method: "POST",
    accessToken,
  });
}

export function publishInvitation(accessToken: string, id: number) {
  return apiRequest<CreatedInvitation>(`/api/v1/invitations/${id}/publish`, {
    method: "POST",
    accessToken,
  });
}
