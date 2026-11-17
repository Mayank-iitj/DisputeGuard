import {
  AgentBrief,
  AgentMetricsResponse,
  CopilotDraft,
  DemoSessionResponse,
  DisputeReason,
  Money,
  Order,
  QueueResponse,
} from '@dg/shared';

const API_BASE = '/api/v1';

class ApiClient {
  private jwt: string | null = null;

  setToken(token: string | null) {
    this.jwt = token;
  }

  getToken(): string | null {
    return this.jwt;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    if (this.jwt) {
      headers['Authorization'] = `Bearer ${this.jwt}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw data.error || new Error(`API error ${res.status}`);
    }
    return data as T;
  }

  async loginPersona(persona: string): Promise<DemoSessionResponse> {
    const data = await this.request<DemoSessionResponse>('/auth/demo-session', {
      method: 'POST',
      body: JSON.stringify({ persona }),
    });
    this.setToken(data.jwt);
    return data;
  }

  async getMe() {
    return this.request<{ user: any; openDisputes: number }>('/me');
  }

  async getOrders(): Promise<{ items: Order[] }> {
    return this.request<{ items: Order[] }>('/orders');
  }

  async getOrder(orderId: string): Promise<{ order: Order; escrow: any; dispute: any }> {
    return this.request<{ order: Order; escrow: any; dispute: any }>(`/orders/${orderId}`);
  }

  async createDispute(orderId: string, reason: DisputeReason, text = '') {
    return this.request<any>('/disputes', {
      method: 'POST',
      body: JSON.stringify({ orderId, reason, text }),
    });
  }

  async getDispute(id: string) {
    return this.request<any>(`/disputes/${id}`);
  }

  async getTimeline(id: string) {
    return this.request<{ timeline: any[] }>(`/disputes/${id}/timeline`);
  }

  async observe(disputeId: string, messageUid: string, text: string) {
    return this.request<any>(`/disputes/${disputeId}/observe`, {
      method: 'POST',
      body: JSON.stringify({ messageUid, text, ts: Date.now() }),
    });
  }

  async translate(disputeId: string, targetLang: string, items: Array<{ messageUid: string; text: string }>) {
    return this.request<{ items: any[] }>('/translate', {
      method: 'POST',
      body: JSON.stringify({ disputeId, targetLang, items }),
    });
  }

  async submitEvidence(disputeId: string, files?: any[]) {
    return this.request<any>(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  }

  async respondProposal(
    disputeId: string,
    proposalId: string,
    response: 'accept' | 'counter' | 'decline',
    optionId?: string,
    counterAmount?: Money
  ) {
    return this.request<any>(`/disputes/${disputeId}/proposals/${proposalId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, optionId, counterAmount }),
    });
  }

  async getQueue(): Promise<QueueResponse> {
    return this.request<QueueResponse>('/agent/queue');
  }

  async getBrief(id: string): Promise<AgentBrief> {
    return this.request<AgentBrief>(`/agent/disputes/${id}/brief`);
  }

  async takeover(id: string, force = false) {
    return this.request<any>(`/agent/disputes/${id}/takeover`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  async copilotDraft(id: string, intent?: string, targetParty: 'buyer' | 'seller' = 'buyer') {
    return this.request<{ draft: CopilotDraft; grounding: string[]; warnings: string[] }>(
      `/agent/disputes/${id}/copilot-draft`,
      {
        method: 'POST',
        body: JSON.stringify({ intent, targetParty }),
      }
    );
  }

  async resolveDispute(
    id: string,
    action: 'refund_full' | 'refund_partial' | 'release_to_seller' | 'request_more_evidence',
    note: string,
    amount?: Money,
    override = false
  ) {
    return this.request<any>(`/agent/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, note, amount, override }),
    });
  }

  async unfreeze(id: string, reason: string) {
    return this.request<any>(`/agent/disputes/${id}/unfreeze`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getMetrics(): Promise<AgentMetricsResponse> {
    return this.request<AgentMetricsResponse>('/agent/metrics');
  }

  async resetDemo() {
    return this.request<{ ok: boolean; message: string }>('/demo/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();
