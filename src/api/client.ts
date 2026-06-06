import axios from 'axios';
import type { ApiResponse } from '@shared/types';

type ToastCallback = (message: string, type: 'success' | 'error' | 'warning') => void;

let toastCallback: ToastCallback | null = null;

export const setToastCallback = (callback: ToastCallback) => {
  toastCallback = callback;
};

const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
  if (toastCallback) {
    toastCallback(message, type);
  }
};

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data && data.success === false && data.message) {
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

export const request = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> => {
  try {
    const response = await client.request<ApiResponse<T>>({
      method,
      url,
      data,
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

export default client;
