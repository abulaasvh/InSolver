const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('insolver_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('insolver_token');
    localStorage.removeItem('insolver_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || `HTTP ${res.status}`);
  }

  // Handle CSV blob responses
  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('text/csv')) {
    return res.text() as unknown as T;
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<any>('/auth/me'),

  // Cases
  getCases: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/cases${qs}`);
  },

  getCase: (id: string) => request<any>(`/cases/${id}`),

  getCaseByCode: (code: string) => request<any>(`/cases/by-code/${code}`),

  registerCase: (data: any) =>
    request<any>('/cases', { method: 'POST', body: JSON.stringify(data) }),

  confirmRouting: (id: string, data: any) =>
    request<any>(`/cases/${id}/confirm-routing`, { method: 'POST', body: JSON.stringify(data) }),

  updateCase: (id: string, data: any) =>
    request<any>(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getMyQueue: () => request<any[]>('/cases/my-queue'),

  getUnreadAlerts: () => request<any[]>('/cases/alerts/unread'),

  getRoutingSuggestion: (id: string) => request<any>(`/cases/${id}/routing-suggestion`),

  // Institutions
  getInstitutions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/institutions${qs}`);
  },

  getInstitution: (id: string) => request<any>(`/institutions/${id}`),

  getInstitutionByAicteId: (aicteId: string) =>
    request<any>(`/institutions/by-aicte-id/${encodeURIComponent(aicteId)}`),

  // Bureaus
  getBureaus: () => request<any[]>('/bureaus'),

  // Overlaps
  getOverlaps: (institutionId?: string) => {
    const qs = institutionId ? `?institutionId=${institutionId}` : '';
    return request<any[]>(`/overlaps${qs}`);
  },

  reviewOverlap: (id: string, action: string, reason?: string) =>
    request<any>(`/overlaps/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),

  runOverlapDetection: () =>
    request<any>('/overlaps/run-detection', { method: 'POST' }),

  // Reports
  getReportStats: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/reports/stats${qs}`);
  },

  exportCsv: async (params?: Record<string, string>) => {
    const token = getToken();
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/reports/export-csv${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insolver-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Audit
  getAuditTrail: (entityType?: string, entityId?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    return request<any[]>(`/audit?${params.toString()}`);
  },
};
