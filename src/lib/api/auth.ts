import { ACCESS_TOKEN_STORAGE_KEY } from "../config";
import { apiRequest } from "./client";
import type { AuthSession, AuthUser, TelegramLoginPayload } from "./types";

export async function loginWithTelegram(payload: TelegramLoginPayload) {
  return apiRequest<AuthSession>("/api/v1/auth/telegram", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function refreshAccessToken() {
  return apiRequest<{ accessToken: string }>("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchMe(accessToken: string) {
  return apiRequest<AuthUser>("/api/v1/me", { accessToken });
}

export async function logout() {
  return apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function restoreAuthSession() {
  let accessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (!accessToken) {
    const refreshed = await refreshAccessToken();
    accessToken = refreshed.accessToken;
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  }

  const user = await fetchMe(accessToken);
  return { accessToken, user } satisfies AuthSession;
}

export function saveAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
