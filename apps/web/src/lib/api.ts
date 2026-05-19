import { useAuthStore } from '../store/useAuthStore';

const API_URL = 'http://localhost:3000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const { userToken, logout } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (userToken) {
    headers.set('Authorization', `Bearer ${userToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  // Handle NO_CONTENT responses gracefully
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
