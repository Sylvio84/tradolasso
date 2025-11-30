import { TOKEN_KEY, USER_KEY } from "../authProvider";
import { API_URL } from "../../config/api";

export interface HttpResponse<T = any> {
  data: T;
  headers: Headers;
  status: number;
}

/**
 * HTTP client with authentication and error handling
 * Handles JWT token attachment and automatic logout on 401 errors
 */
export const http = async <T = any>(path: string, init?: RequestInit): Promise<HttpResponse<T>> => {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    Accept: "application/ld+json",
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const bodyText = await res.text();
  const data = (contentType.includes("application/json") || contentType.includes("application/ld+json")) && bodyText
    ? JSON.parse(bodyText)
    : bodyText;

  if (!res.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (res.status === 401) {
      // Clear stored authentication data
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Reload the page to trigger authentication check
      window.location.href = '/login';

      // Still throw the error for consistency
      const error = new Error('Authentication expired. Please login again.') as Error & {
        statusCode: number;
        errors?: any;
      };
      error.statusCode = 401;
      error.errors = data?.violations;
      throw error;
    }

    // Build error message from Hydra error response
    // Hydra errors have: title, detail, description, status
    // Prioritize description if available
    const errorMessage = data?.description || data?.detail || data?.title || res.statusText;

    // Compatible avec Refine: Error object avec message + statusCode (+ violations Hydra)
    const error = new Error(errorMessage) as Error & {
      statusCode: number;
      errors?: any;
    };
    error.statusCode = res.status;
    error.errors = data?.violations;
    throw error;
  }

  return { data, headers: res.headers, status: res.status };
};