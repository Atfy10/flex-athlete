const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresAt");
    window.location.href = "/login";
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
    super(data.message as string || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (this.data.errors && typeof this.data.errors === "object") {
      for (const field of Object.values(this.data.errors)) {
        if (Array.isArray(field)) {
          errors.push(...field);
        }
      }
    }
    if (this.data.message && typeof this.data.message === "string") {
      errors.push(this.data.message);
    }
    if (errors.length === 0 && this.data.title && typeof this.data.title === "string") {
      errors.push(this.data.title);
    }
    return errors.length > 0 ? errors : [this.message];
  }
}
