import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        return { isOnline: true, data };
      }
    } catch {
      // Backend is offline or unreachable - fallback to seamless local sync
    }
    return { isOnline: false, data: null };
  }

  async getAuthHeaders(isFormData = false) {
    try {
      const token = await AsyncStorage.getItem('@fixbee_token');
      const headers = {};
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    } catch {
      return isFormData ? {} : { 'Content-Type': 'application/json' };
    }
  }

  async get(endpoint, params = null) {
    try {
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const query = Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        if (query) {
          url += (url.includes('?') ? '&' : '?') + query;
        }
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(url, { method: 'GET', headers });
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message, isNetworkError: true };
    }
  }

  async post(endpoint, body, isFormData = false) {
    try {
      const headers = await this.getAuthHeaders(isFormData);
      const options = {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message, isNetworkError: true };
    }
  }

  async patch(endpoint, body, isFormData = false) {
    try {
      const headers = await this.getAuthHeaders(isFormData);
      const options = {
        method: 'PATCH',
        headers,
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message, isNetworkError: true };
    }
  }

  async delete(endpoint) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: err.message, isNetworkError: true };
    }
  }
}

export const apiService = new ApiService();
