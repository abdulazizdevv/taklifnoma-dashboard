export const ACCESS_TOKEN_STORAGE_KEY = "taklifnoma.admin.accessToken";

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "https://api.taklifnoma.my").replace(/\/$/, "");
}

export function getTelegramBotUsername() {
  return import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "taklifnomalar_robot";
}
