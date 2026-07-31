import { ApiError, Album, AlbumInput, AuthResponse, ITunesSearchResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const TOKEN_KEY = "resonance_token";
const EMAIL_KEY = "resonance_email";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EMAIL_KEY);
}

export function storeSession(token: string, email: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };
  const token = getToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    let code = "UNKNOWN";
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body === "object") {
        code = body.error ?? code;
        detail = body.detail ?? detail;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, code, detail);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false),

  search: (term: string, entity = "album", limit = 12, signal?: AbortSignal) =>
    request<ITunesSearchResponse>(
      `/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=${limit}`,
      { signal },
      false
    ),

  getLibrary: () => request<Album[]>("/library"),

  getInsights: () => request<Record<string, unknown>>("/insights/summary"),

  addAlbum: (album: AlbumInput) =>
    request<Album>("/library", {
      method: "POST",
      body: JSON.stringify(album),
    }),

  updateAlbum: (id: number, album: Partial<AlbumInput>) =>
    request<Album>(`/library/${id}`, {
      method: "PUT",
      body: JSON.stringify(album),
    }),

  deleteAlbum: (id: number) =>
    request<void>(`/library/${id}`, { method: "DELETE" }),
};
