import { apiClient } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'tender_creator' | 'vendor';
  company?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        return { user, token };
      }
      throw new Error(response.error || 'Login failed');
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.register(userData);
      if (response.success && response.data) {
        const { user, token } = response.data;
        apiClient.setToken(token);
        return { user, token };
      }
      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.removeToken();
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export default authService;
