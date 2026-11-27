import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@fixbee_token';
const REFRESH_TOKEN_KEY = '@fixbee_refresh_token';

const getBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (configuredUrl) {
    const apiUrl = configuredUrl.endsWith('/api/v1')
      ? configuredUrl
      : `${configuredUrl}/api/v1`;
    return Platform.OS === 'android'
      ? apiUrl.replace(
        /^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i,
        (_match, protocol) => `${protocol}10.0.2.2`
      )
      : apiUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

const readResponse = async (response) => {
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }
};

const responseError = (payload, response) => {
  const error = new Error(payload?.message || `Request failed with status ${response.status}.`);
  error.status = response.status;
  return error;
};

const getImageType = (uri, assetType) => {
  if (assetType?.startsWith('image/')) return assetType;
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
};

export const createImageFormData = async (uri, fieldName, fields = {}) => {
  if (!uri) throw new Error('An image is required.');

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });

  const fileName = uri.split('/').pop()?.split('?')[0] || `image-${Date.now()}.jpg`;
  const type = getImageType(uri);

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Unable to read the selected image.');
    const blob = await response.blob();
    formData.append(fieldName, blob, fileName);
  } else {
    formData.append(fieldName, { uri, name: fileName, type });
  }

  return formData;
};

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.refreshPromise = null;
  }

  async checkHealth() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      const data = await readResponse(response);
      return response.ok
        ? { isOnline: true, data }
        : { isOnline: false, data: null };
    } catch {
      return { isOnline: false, data: null };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getAuthHeaders(isFormData = false) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers = {};
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async refreshSession() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const payload = await readResponse(response);
      if (!response.ok || !payload?.data?.accessToken || !payload?.data?.refreshToken) {
        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, '@fixbee_user']);
        }
        throw responseError(payload, response);
      }

      await AsyncStorage.multiSet([
        [TOKEN_KEY, payload.data.accessToken],
        [REFRESH_TOKEN_KEY, payload.data.refreshToken],
      ]);
      return payload.data.accessToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async request(endpoint, options = {}, canRefresh = true) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(await this.getAuthHeaders(isFormData)),
      ...(options.headers || {}),
    };
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (
      response.status === 401
      && canRefresh
      && endpoint !== '/auth/google'
      && endpoint !== '/auth/refresh'
    ) {
      const accessToken = await this.refreshSession();
      return this.request(endpoint, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
      }, false);
    }

    const payload = await readResponse(response);
    if (!response.ok || payload?.success === false) {
      throw responseError(payload, response);
    }
    return payload;
  }

  async get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const query = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      if (query) url += `${url.includes('?') ? '&' : '?'}${query}`;
    }
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, body, isFormData = false) {
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async patch(endpoint, body, isFormData = false) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  async delete(endpoint, body) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}

export const apiService = new ApiService();
