const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL);
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': body ? 'application/json' : 'application/json',
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody as { message?: string } | null)?.message ||
      response.statusText ||
      'Request failed';
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type AuthSessionResponse = {
  access_token: string;
  refresh_token?: string;
  user: unknown;
};

export type AuthUserResponse = {
  email: string;
  id: string;
  name?: string;
};

export const api = {
  auth: {
    login(payload: { email: string; password: string }) {
      return apiRequest<AuthSessionResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      });
    },
    register(payload: { name: string; email: string; password: string }) {
      return apiRequest<AuthSessionResponse>('/auth/register', {
        method: 'POST',
        body: payload,
      });
    },
    refresh(payload: { refreshToken?: string } = {}) {
      return apiRequest<AuthSessionResponse>('/auth/refresh', {
        method: 'POST',
        body: payload,
      });
    },
    logout(payload: { refreshToken?: string } = {}) {
      return apiRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: payload,
      });
    },
    resendVerification(payload: { email: string }) {
      return apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: payload,
      });
    },
    verifyEmail(payload: { token: string }) {
      return apiRequest<{ status?: string; message?: string }>(
        '/auth/verify-email',
        {
          method: 'POST',
          body: payload,
        },
      );
    },
  },
};
