const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Tender endpoints
  async getTenders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/tenders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(endpoint);
  }

  async getTender(id: string) {
    return this.request<any>(`/tenders/${id}`);
  }

  async createTender(tenderData: {
    title: string;
    description: string;
    category: string;
    budget: number;
    deadline: string;
    requirements?: string;
    attachments?: any[];
  }) {
    return this.request<any>('/tenders', {
      method: 'POST',
      body: JSON.stringify(tenderData),
    });
  }

  async updateTender(id: string, tenderData: any) {
    return this.request<any>(`/tenders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tenderData),
    });
  }

  async deleteTender(id: string) {
    return this.request(`/tenders/${id}`, { method: 'DELETE' });
  }

  async awardTender(id: string, bidId: string) {
    return this.request(`/tenders/${id}/award`, {
      method: 'POST',
      body: JSON.stringify({ bidId }),
    });
  }

  // Bid endpoints
  async getBids(tenderId?: string) {
    const endpoint = tenderId ? `/bids?tenderId=${tenderId}` : '/bids';
    return this.request<any[]>(endpoint);
  }

  async createBid(bidData: {
    tenderId: string;
    amount: number;
    proposal: string;
    attachments?: any[];
  }) {
    return this.request<any>('/bids', {
      method: 'POST',
      body: JSON.stringify(bidData),
    });
  }

  async updateBid(id: string, bidData: any) {
    return this.request<any>(`/bids/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bidData),
    });
  }

  async deleteBid(id: string) {
    return this.request(`/bids/${id}`, { method: 'DELETE' });
  }

  // User endpoints
  async getUsers(params?: { page?: number; limit?: number; role?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(endpoint);
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getChartData() {
    return this.request<any>('/dashboard/charts');
  }

  // Notification endpoints
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
