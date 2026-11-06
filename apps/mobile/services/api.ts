import axios, { type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ApiErrorEnvelope } from '@master-sheet/contracts';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000',
});

export async function getJson<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.get<T>(url, config);
  return response.data;
}

export async function postJson<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post<T>(url, body, config);
  return response.data;
}

export async function patchJson<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.patch<T>(url, body, config);
  return response.data;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && message.length > 0) {
    return message.join(', ');
  }

  return fallback;
}

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('master-sheet-jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
