import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@shared/types';

type ToastCallback = (message: string, type: 'success' | 'error' | 'warning') => void;
type HttpMethod = 'get' | 'post' | 'put' | 'delete';

interface ApiConfig {
  baseURL: string;
}

let toastCallback: ToastCallback | null = null;

export const setToastCallback = (callback: ToastCallback) => {
  toastCallback = callback;
};

const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  if (toastCallback) {
    toastCallback(message, type);
  }
};

const createAxiosInstance = (config: ApiConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      const data = response.data as ApiResponse<unknown>;
      if (data && !data.success && data.message) {
        showToast(data.message, 'error');
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else if (error.message) {
        showToast(error.message, 'error');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const client = createAxiosInstance({ baseURL: '/api' });

export const request = async <T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>
): Promise<ApiResponse<T>> => {
  try {
    const response = await client.request<ApiResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data as ApiResponse<T>;
      if (responseData?.message) {
        showToast(responseData.message, 'error');
      }
      return responseData;
    }
    const errorMessage = '网络错误';
    showToast(errorMessage, 'error');
    return { success: false, message: errorMessage };
  }
};

export const createApiClient = <T extends Record<string, unknown>>(
  baseEndpoint: string
) => {
  return {
    get: <R>(path: string = '') => request<R>('get', `${baseEndpoint}${path}`),
    post: <R>(data: unknown, path: string = '') => request<R>('post', `${baseEndpoint}${path}`, data),
    put: <R>(data: unknown, path: string = '') => request<R>('put', `${baseEndpoint}${path}`, data),
    delete: <R>(path: string = '', data?: unknown) => request<R>('delete', `${baseEndpoint}${path}`, data),
  };
};

export default client;
