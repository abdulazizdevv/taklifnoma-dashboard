import { getApiBaseUrl } from "../config";

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { accessToken, headers, ...init } = options;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : `API ${response.status} qaytardi`;
    throw new ApiError(message, response.status, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
