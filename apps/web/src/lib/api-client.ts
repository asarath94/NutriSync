import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GoalsListResponse,
} from "@nutrisync/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type ApiStatus = "idle" | "retrying";
export type StatusListener = (status: ApiStatus) => void;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Render's free tier can take 30-50s to wake a sleeping instance. Network-level
// failures (unreachable, timed out) get retried with backoff up to this budget;
// a real HTTP response (even 4xx/5xx) is returned immediately, never retried.
const RETRY_BUDGET_MS = 60_000;
const ATTEMPT_TIMEOUT_MS = 8_000;
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 8000, 8000, 8000, 8000];

async function apiFetch(
  path: string,
  init: RequestInit,
  onStatusChange?: StatusListener,
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const deadline = Date.now() + RETRY_BUDGET_MS;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...init, credentials: "include", signal: controller.signal });
      onStatusChange?.("idle");
      return res;
    } catch {
      if (Date.now() >= deadline) {
        onStatusChange?.("idle");
        throw new Error("Couldn't reach the server. Please check your connection and try again.");
      }
      onStatusChange?.("retrying");
      const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      typeof body?.error === "string" ? body.error : `Request failed (${res.status})`,
      res.status,
    );
  }
  return body as T;
}

const jsonHeaders = { "Content-Type": "application/json" };

export function register(data: RegisterRequest, onStatusChange?: StatusListener): Promise<AuthResponse> {
  return apiFetch(
    "/api/auth/register",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) },
    onStatusChange,
  ).then(parseOrThrow<AuthResponse>);
}

export function login(data: LoginRequest, onStatusChange?: StatusListener): Promise<AuthResponse> {
  return apiFetch(
    "/api/auth/login",
    { method: "POST", headers: jsonHeaders, body: JSON.stringify(data) },
    onStatusChange,
  ).then(parseOrThrow<AuthResponse>);
}

export function logout(onStatusChange?: StatusListener): Promise<void> {
  return apiFetch("/api/auth/logout", { method: "POST" }, onStatusChange).then((res) => {
    if (!res.ok) throw new ApiError("Logout failed", res.status);
  });
}

export function getMe(onStatusChange?: StatusListener): Promise<AuthResponse> {
  return apiFetch("/api/me", { method: "GET" }, onStatusChange).then(parseOrThrow<AuthResponse>);
}

export function listGoals(onStatusChange?: StatusListener): Promise<GoalsListResponse> {
  return apiFetch("/api/goals", { method: "GET" }, onStatusChange).then(parseOrThrow<GoalsListResponse>);
}
