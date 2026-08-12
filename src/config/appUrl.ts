/**
 * Single source of truth for the application's public URL.
 * Works across development, staging and production without hard-coded hosts.
 */
export const APP_URL: string =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const appUrl = (path: string) =>
  `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Canonical recovery callback route. Must be allow-listed in Auth redirect URLs. */
export const RESET_PASSWORD_PATH = "/auth/reset-password";
export const RESET_PASSWORD_URL = () => appUrl(RESET_PASSWORD_PATH);
