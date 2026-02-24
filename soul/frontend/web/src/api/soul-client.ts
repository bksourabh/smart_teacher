/**
 * Soul AI API client.
 * Handles both REST requests and SSE streaming.
 * Pattern borrowed from opensoulai's gateway client architecture.
 */

import type {
  ChatResponse,
  ConfigResponse,
  HabitResponse,
  LearningResponse,
  ManasOutput,
  BuddhiOutput,
  SanskaraOutput,
  StreamEventType,
} from "../types.js";

export class SoulClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    // Empty base = same origin (works with Vite proxy in dev)
    this.baseUrl = baseUrl;
  }

  private url(path: string) {
    return `${this.baseUrl}/api/v1${path}`;
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(this.url("/health"));
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(message: string): Promise<ChatResponse> {
    const res = await fetch(this.url("/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
    return res.json();
  }

  /**
   * Stream soul responses via SSE.
   * Calls the callback for each event as it arrives.
   */
  async *streamChat(
    message: string
  ): AsyncGenerator<{ event: StreamEventType; data: unknown }> {
    const res = await fetch(this.url("/chat/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventLine = block.match(/^event: (.+)$/m);
        const dataLine = block.match(/^data: (.+)$/ms);
        if (!eventLine || !dataLine) continue;
        const event = eventLine[1].trim() as StreamEventType;
        try {
          const data = JSON.parse(dataLine[1].trim());
          yield { event, data };
        } catch {
          // ignore malformed data lines
        }
      }
    }
  }

  async getHabits(category?: string, minWeight?: number): Promise<HabitResponse[]> {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (minWeight !== undefined) params.set("min_weight", String(minWeight));
    const qs = params.toString() ? `?${params}` : "";
    const res = await fetch(this.url(`/habits${qs}`));
    return res.json();
  }

  async reinforceHabit(id: number): Promise<HabitResponse> {
    const res = await fetch(this.url(`/habits/${id}/reinforce`), { method: "PUT" });
    if (!res.ok) throw new Error("Failed to reinforce habit");
    return res.json();
  }

  async getConfig(): Promise<ConfigResponse> {
    const res = await fetch(this.url("/config"));
    return res.json();
  }

  async updateConfig(patch: Partial<ConfigResponse>): Promise<ConfigResponse> {
    const res = await fetch(this.url("/config"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update config");
    return res.json();
  }

  async getPendingLearnings(): Promise<LearningResponse[]> {
    const res = await fetch(this.url("/trainer/pending"));
    return res.json();
  }

  async getAllLearnings(): Promise<LearningResponse[]> {
    const res = await fetch(this.url("/trainer/learnings"));
    return res.json();
  }

  async respondToLearning(
    id: number,
    guidance: string,
    applicationNote: string,
    modulesInformed = "all",
    confidenceBoost = 0.7
  ): Promise<LearningResponse> {
    const res = await fetch(this.url(`/trainer/respond/${id}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guidance,
        application_note: applicationNote,
        modules_informed: modulesInformed,
        confidence_boost: confidenceBoost,
      }),
    });
    if (!res.ok) throw new Error("Failed to respond to learning");
    return res.json();
  }

  async createLearning(params: {
    trigger_summary: string;
    question_context?: string;
    keywords: string;
    guidance: string;
    application_note: string;
    modules_informed?: string;
    confidence_boost?: number;
  }): Promise<LearningResponse> {
    const res = await fetch(this.url("/trainer/learnings"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to create learning");
    return res.json();
  }

  async supersedeLearning(id: number): Promise<void> {
    await fetch(this.url(`/trainer/learnings/${id}`), { method: "DELETE" });
  }

  async toggleLearningMode(enabled: boolean): Promise<ConfigResponse> {
    return this.updateConfig({ learning_mode_enabled: enabled });
  }
}

export const soulClient = new SoulClient();
