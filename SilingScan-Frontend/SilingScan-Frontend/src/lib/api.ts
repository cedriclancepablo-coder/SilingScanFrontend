import { API_URL } from "../providers/constants";

const SESSION_TOKEN_KEY = "siling-scan-session-token";

type ApiErrorBody = {
  message?: string;
};

export const getSessionToken = (): string | null =>
  window.localStorage.getItem(SESSION_TOKEN_KEY);

export const setSessionToken = (token: string): void => {
  window.localStorage.setItem(SESSION_TOKEN_KEY, token);
};

export const clearSessionToken = (): void => {
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
};

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);
  const token = getSessionToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      "Could not connect to the SilingScan API. Check that the backend is running.",
    );
  }

  if (!response.ok) {
    let message = `API request failed (${response.status}).`;
    try {
      const body: ApiErrorBody = await response.json();
      if (typeof body.message === "string" && body.message) {
        message = body.message;
      }
    } catch {
      // Keep the HTTP status message if the server did not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
