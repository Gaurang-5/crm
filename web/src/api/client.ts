export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: { message: `Request failed with status ${res.status}` } };
    }
    const message = errorData?.error?.message || errorData?.message || `HTTP ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
    (error as any).code = errorData?.error?.code;
    throw error;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getSession: () => apiRequest('/api/auth/session'),

  // Today
  getToday: () => apiRequest('/api/reports/today'),

  // Leads & Pipeline
  getLeads: () => apiRequest('/api/leads'),
  getLead: (phone: string) => apiRequest(`/api/leads/${phone}`),
  createLead: (data: any) => apiRequest('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (phone: string, data: any) => apiRequest(`/api/leads/${phone}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLeadStage: (phone: string, data: { stage: string; reason?: string; metadata?: any }) =>
    apiRequest(`/api/leads/${phone}/stage`, { method: 'POST', body: JSON.stringify(data) }),
  getPipelineStages: () => apiRequest('/api/pipeline/stages'),
  ingestLead: (data: any) => apiRequest('/api/ingest', { method: 'POST', body: JSON.stringify(data) }),

  // Activities, Tasks & Appointments
  getActivities: (params?: { phone?: string; customerId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/api/activities${q ? `?${q}` : ''}`);
  },
  createActivity: (data: any) => apiRequest('/api/activities', { method: 'POST', body: JSON.stringify(data) }),
  getTasks: (status?: string) => apiRequest(`/api/tasks${status ? `?status=${status}` : ''}`),
  createTask: (data: any) => apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTaskStatus: (id: number, status: string) => apiRequest(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAppointments: (status?: string) => apiRequest(`/api/appointments${status ? `?status=${status}` : ''}`),
  createAppointment: (data: any) => apiRequest('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: number, status: string) =>
    apiRequest(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Customers
  getCustomers: (status?: string) => apiRequest(`/api/customers${status ? `?status=${status}` : ''}`),
  getCustomer: (id: string) => apiRequest(`/api/customers/${id}`),
  convertLeadToCustomer: (data: any) => apiRequest('/api/customers/convert', { method: 'POST', body: JSON.stringify(data) }),
  toggleOnboardingItem: (id: number, is_completed: boolean) =>
    apiRequest(`/api/customers/onboarding/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ is_completed }) }),
  createCheckin: (customerId: string, data: any) =>
    apiRequest(`/api/customers/${customerId}/checkins`, { method: 'POST', body: JSON.stringify(data) }),
  createMeasurement: (customerId: string, data: any) =>
    apiRequest(`/api/customers/${customerId}/measurements`, { method: 'POST', body: JSON.stringify(data) }),
  createPhoto: (customerId: string, data: any) =>
    apiRequest(`/api/customers/${customerId}/photos`, { method: 'POST', body: JSON.stringify(data) }),
  createMilestone: (customerId: string, data: any) =>
    apiRequest(`/api/customers/${customerId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),

  // Commerce
  getPlans: () => apiRequest('/api/commerce/plans'),
  getProducts: () => apiRequest('/api/commerce/products'),
  getOrders: (params?: { phone?: string; customerId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiRequest(`/api/commerce/orders${q ? `?${q}` : ''}`);
  },
  createOrder: (data: any) => apiRequest('/api/commerce/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: number, status: string) =>
    apiRequest(`/api/commerce/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getPayments: (customerId?: string) =>
    apiRequest(`/api/commerce/payments${customerId ? `?customerId=${customerId}` : ''}`),
  createPayment: (data: any) => apiRequest('/api/commerce/payments', { method: 'POST', body: JSON.stringify(data) }),
  getRefunds: (customerId?: string) =>
    apiRequest(`/api/commerce/refunds${customerId ? `?customerId=${customerId}` : ''}`),
  createRefund: (data: any) => apiRequest('/api/commerce/refunds', { method: 'POST', body: JSON.stringify(data) }),
  getExpenses: () => apiRequest('/api/commerce/expenses'),
  createExpense: (data: any) => apiRequest('/api/commerce/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getBalances: () => apiRequest('/api/commerce/balances'),
  getProfitSheets: () => apiRequest('/api/commerce/profit-sheets'),
  getProfitSheet: (sheetId: string) => apiRequest(`/api/commerce/profit-sheets/${sheetId}`),

  // Campaigns
  getCampaigns: () => apiRequest('/api/campaigns'),

  // Automations
  getTemplates: () => apiRequest('/api/automations/templates'),
  getAutomationRules: () => apiRequest('/api/automations/rules'),
  updateAutomationRule: (id: string, data: any) =>
    apiRequest(`/api/automations/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAutomationRuns: () => apiRequest('/api/automations/runs'),
  getMessageDeliveries: () => apiRequest('/api/automations/deliveries'),
  triggerAutomation: (trigger_event: string, context: any) =>
    apiRequest('/api/automations/trigger', { method: 'POST', body: JSON.stringify({ trigger_event, context }) }),

  // Reports
  getRetention: () => apiRequest('/api/reports/retention'),
  getAuditEvents: () => apiRequest('/api/audit'),

  // Settings
  getSettings: () => apiRequest('/api/settings'),
  updateSetting: (key: string, value: string) =>
    apiRequest('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),

  // Forms with Compulsory Validation
  createBodyAnalysis: (data: any) =>
    apiRequest('/api/body-analysis', { method: 'POST', body: JSON.stringify(data) }),
  getBodyAnalyses: () => apiRequest('/api/body-analyses'),
  sendBodyAnalysisWhatsApp: (phone: string, report: string) =>
    apiRequest('/api/body-analysis/send-whatsapp', { method: 'POST', body: JSON.stringify({ phone, report }) }),
  saveConsumerHomevisit: (data: any) =>
    apiRequest('/api/consumer-homevisit', { method: 'POST', body: JSON.stringify(data) }),
  getConsumerHomevisits: (phone?: string, customerId?: string) => {
    const q = new URLSearchParams({
      ...(phone ? { phone } : {}),
      ...(customerId ? { customerId } : {}),
    }).toString();
    return apiRequest(`/api/consumer-homevisit${q ? `?${q}` : ''}`);
  },
};
