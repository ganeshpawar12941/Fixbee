import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Reference the Fixbee backend:
// On Android emulator, localhost is 10.0.2.2; on web/iOS, localhost is 127.0.0.1
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

/**
 * Custom API client aligned with Fixbee backend ApiResponse and ApiError standards.
 */
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { isOnline: true, data };
      }
    } catch {
      // Backend is offline or unreachable - seamless local fallback
    }
    return { isOnline: false, data: null };
  }

  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem('@fixbee_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  async get(endpoint) {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async post(endpoint, body) {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(body),
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export const apiService = new ApiService();
