import { useEffect, useRef } from "react";
import { getTelegramBotUsername } from "../lib/config";
import type { TelegramLoginPayload } from "../lib/api/types";

declare global {
  interface Window {
    onTaklifnomaTelegramAuth?: (payload: TelegramLoginPayload) => void;
  }
}

type TelegramLoginWidgetProps = {
  onLogin: (payload: TelegramLoginPayload) => void;
};

export function TelegramLoginWidget({ onLogin }: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = getTelegramBotUsername();

  useEffect(() => {
    window.onTaklifnomaTelegramAuth = onLogin;
    const container = containerRef.current;

    if (!container || !botUsername) {
      return () => {
        delete window.onTaklifnomaTelegramAuth;
      };
    }

    container.innerHTML = "";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "6");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTaklifnomaTelegramAuth(user)");
    container.appendChild(script);

    return () => {
      delete window.onTaklifnomaTelegramAuth;
      container.innerHTML = "";
    };
  }, [botUsername, onLogin]);

  if (!botUsername) {
    return <div className="telegram-widget-error">Telegram bot username env’da berilmagan.</div>;
  }

  return <div className="telegram-widget" ref={containerRef} />;
}
