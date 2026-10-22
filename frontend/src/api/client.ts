import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.accessToken = token;
  }

  clearToken() {
    this.accessToken = null;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  // Auth
  async login() {
    const response = await this.client.get('/auth/login');
    return response.data;
  }

  async callback(params: URLSearchParams) {
    const response = await this.client.get('/auth/callback', { params });
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.clearToken();
  }

  async me() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Skills
  async listSkills(params?: { level?: string; search?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/skills', { params });
    return response.data;
  }

  async getEffectiveSkills() {
    const response = await this.client.get('/skills/effective');
    return response.data;
  }

  async getSkill(id: number) {
    const response = await this.client.get(`/skills/${id}`);
    return response.data;
  }

  async createSkill(data: any) {
    const response = await this.client.post('/skills', data);
    return response.data;
  }

  async updateSkill(id: number, data: any) {
    const response = await this.client.patch(`/skills/${id}`, data);
    return response.data;
  }

  async deleteSkill(id: number) {
    const response = await this.client.delete(`/skills/${id}`);
    return response.data;
  }

  // Skill Overrides
  async listOverrides() {
    const response = await this.client.get('/skills/overrides');
    return response.data;
  }

  async getOverride(skillName: string) {
    const response = await this.client.get(`/skills/overrides/${skillName}`);
    return response.data;
  }

  async createOverride(data: { skill_name: string; visibility: string }) {
    const response = await this.client.post('/skills/overrides', data);
    return response.data;
  }

  async deleteOverride(skillName: string) {
    const response = await this.client.delete(`/skills/overrides/${skillName}`);
    return response.data;
  }

  // Learning
  async listLessons() {
    const response = await this.client.get('/learning');
    return response.data;
  }

  async getLesson(id: number) {
    const response = await this.client.get(`/learning/${id}`);
    return response.data;
  }

  async getMyProgress() {
    const response = await this.client.get('/learning/progress/me');
    return response.data;
  }

  async submitProgress(lessonId: number, score: number) {
    const response = await this.client.post(`/learning/progress/${lessonId}`, { score });
    return response.data;
  }

  // MCP
  async listMCPServers(params?: { category?: string; search?: string; page?: number; page_size?: number }) {
    const response = await this.client.get('/mcp', { params });
    return response.data;
  }

  async getMCPSategories() {
    const response = await this.client.get('/mcp/categories');
    return response.data;
  }

  async getMCPServer(id: number) {
    const response = await this.client.get(`/mcp/${id}`);
    return response.data;
  }

  async createMCPServer(data: any) {
    const response = await this.client.post('/mcp', data);
    return response.data;
  }

  async updateMCPServer(id: number, data: any) {
    const response = await this.client.patch(`/mcp/${id}`, data);
    return response.data;
  }

  async deleteMCPServer(id: number) {
    const response = await this.client.delete(`/mcp/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();