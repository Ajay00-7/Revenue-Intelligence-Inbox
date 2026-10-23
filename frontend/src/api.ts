import type { Conversation, Metrics, ImportSummary } from './types';

// Support both Vite proxy and direct backend URL
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const DIRECT_BACKEND = API_BASE.startsWith('http') ? API_BASE : 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // If 404 or proxy error, attempt direct backend fallback
      if (res.status === 404 || res.status === 502) {
        url = `${DIRECT_BACKEND}${endpoint}`;
        const fallbackRes = await fetch(url, options);
        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({ detail: fallbackRes.statusText }));
          throw new Error(errData.detail || `HTTP Error ${fallbackRes.status}`);
        }
        return await fallbackRes.json();
      }
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    // If network error occurred with relative url, try direct
    if (!url.startsWith('http')) {
      url = `${DIRECT_BACKEND}${endpoint}`;
      const fallbackRes = await fetch(url, options);
      if (!fallbackRes.ok) {
        const errData = await fallbackRes.json().catch(() => ({ detail: fallbackRes.statusText }));
        throw new Error(errData.detail || `HTTP Error ${fallbackRes.status}`);
      }
      return await fallbackRes.json();
    }
    throw err;
  }
}

export const api = {
  async getMetrics(): Promise<Metrics> {
    return request<Metrics>('/metrics');
  },

  async getConversations(params?: {
    search?: string;
    priority?: string;
    routing?: string;
    stage?: string;
  }): Promise<Conversation[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params?.routing && params.routing !== 'all') query.append('routing', params.routing);
    if (params?.stage && params.stage !== 'all') query.append('stage', params.stage);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<Conversation[]>(`/conversations${queryString}`);
  },

  async getConversation(id: number): Promise<Conversation> {
    return request<Conversation>(`/conversations/${id}`);
  },

  async createConversation(payload: Partial<Conversation>): Promise<Conversation> {
    return request<Conversation>('/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async updateConversation(id: number, payload: Partial<Conversation>): Promise<Conversation> {
    return request<Conversation>(`/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async deleteConversation(id: number): Promise<{ status: string }> {
    return request<{ status: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async importFile(file: File): Promise<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);
    return request<ImportSummary>('/import', {
      method: 'POST',
      body: formData,
    });
  },

  async exportCsv(): Promise<void> {
    const data = await request<{ filename: string; content: string }>('/export/csv');
    const blob = new Blob([data.content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', data.filename || 'conversations_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async exportJson(): Promise<void> {
    const data = await request<any[]>('/export/json');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'conversations_export.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async reseed(): Promise<void> {
    await request('/seed', { method: 'POST' });
  },

  async checkHealth(): Promise<boolean> {
    try {
      await request('/health');
      return true;
    } catch {
      return false;
    }
  }
};
