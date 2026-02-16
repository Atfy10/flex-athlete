const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

// In-memory token used by apiFetch. AuthContext must call setAccessToken/clearAccessToken.
let inMemoryAccessToken: string | null = null;
export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token ?? null;
}
export function clearAccessToken() {
  inMemoryAccessToken = null;
}

let logoutHandler: (() => void) | null = null;
let isLogoutInProgress = false;
export function registerLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Authorization header only when there is an in-memory token and skipAuth !== true
  if (!skipAuth && inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Handle unauthorized globally by invoking registered logout handler once
  if (response.status === 401) {
    if (logoutHandler && !isLogoutInProgress) {
      try {
        isLogoutInProgress = true;
        logoutHandler();
      } finally {
        isLogoutInProgress = false;
      }
    }
    // Throw a standard error to callers
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    const d = data as Record<string, unknown>;
    const msg =
      typeof d["message"] === "string"
        ? (d["message"] as string)
        : `Request failed with status ${status}`;
    super(msg);
    this.status = status;
    this.data = data;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    const d = this.data as Record<string, unknown>;
    const maybeErrors = d["errors"];
    if (maybeErrors && typeof maybeErrors === "object") {
      for (const field of Object.values(
        maybeErrors as Record<string, unknown>,
      )) {
        if (Array.isArray(field)) {
          errors.push(...field.map((v) => String(v)));
        } else if (typeof field === "string") {
          errors.push(field);
        }
      }
    }
    const maybeMessage = d["message"];
    if (typeof maybeMessage === "string") {
      errors.push(maybeMessage);
    }
    if (errors.length === 0) {
      const maybeTitle = d["title"];
      if (typeof maybeTitle === "string") errors.push(maybeTitle);
    }
    return errors.length > 0 ? errors : [this.message];
  }
}
