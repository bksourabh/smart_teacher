import axios, { AxiosInstance } from "axios";
import {
  ChatResponse,
  HabitResponse,
  ConfigResponse,
  LearningResponse,
  TrainerGuidanceRequest,
  TrainerLearningCreate,
} from "./types";

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: 120000, // 2 min for Claude calls
    });
  }

  async health(): Promise<boolean> {
    try {
      const res = await this.client.get("/health");
      return res.data.status === "ok";
    } catch {
      return false;
    }
  }

  async chat(message: string): Promise<ChatResponse> {
    const res = await this.client.post("/chat", { message });
    return res.data;
  }

  async getHabits(
    category?: string,
    minWeight?: number
  ): Promise<HabitResponse[]> {
    const params: Record<string, string | number> = {};
    if (category) params.category = category;
    if (minWeight !== undefined) params.min_weight = minWeight;
    const res = await this.client.get("/habits", { params });
    return res.data;
  }

  async getConfig(): Promise<ConfigResponse> {
    const res = await this.client.get("/config");
    return res.data;
  }

  async updateConfig(
    updates: Partial<ConfigResponse>
  ): Promise<ConfigResponse> {
    const res = await this.client.put("/config", updates);
    return res.data;
  }

  // --- Trainer endpoints ---

  async getPendingLearnings(): Promise<LearningResponse[]> {
    const res = await this.client.get("/trainer/pending");
    return res.data;
  }

  async getActiveLearnings(): Promise<LearningResponse[]> {
    const res = await this.client.get("/trainer/learnings");
    return res.data;
  }

  async respondToLearning(
    id: number,
    data: TrainerGuidanceRequest
  ): Promise<LearningResponse> {
    const res = await this.client.post(`/trainer/respond/${id}`, data);
    return res.data;
  }

  async createLearning(
    data: TrainerLearningCreate
  ): Promise<LearningResponse> {
    const res = await this.client.post("/trainer/learnings", data);
    return res.data;
  }

  async deleteLearning(id: number): Promise<LearningResponse> {
    const res = await this.client.delete(`/trainer/learnings/${id}`);
    return res.data;
  }
}
