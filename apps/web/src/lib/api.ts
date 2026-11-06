import type { ApiErrorEnvelope } from '@master-sheet/contracts';
import { useAuthStore } from '../store/useAuthStore';
import { getApiBaseUrl } from '../services/api';

const API_URL = getApiBaseUrl();

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, logout } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await logout().catch(() => undefined);
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => ({}))) as ApiErrorEnvelope;
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message;
    throw new Error(message || 'Something went wrong');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
