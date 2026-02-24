// Soul AI Web — TypeScript types matching the FastAPI backend schemas

export interface ManasOutput {
  module: "manas";
  response: string;
  confidence: number;       // 0–1
  valence: number;          // −1 (negative) to +1 (positive)
  metadata?: Record<string, unknown>;
}

export interface BuddhiOutput {
  module: "buddhi";
  response: string;
  confidence: number;
  reasoning_chain: string[];
  metadata?: Record<string, unknown>;
}

export interface SanskaraOutput {
  module: "sanskaras";
  response: string;
  confidence: number;
  activated_habits: { name: string; weight: number; influence?: string }[];
  metadata?: Record<string, unknown>;
}

export interface SynthesisOutput {
  response: string;
  weights: { manas: number; buddhi: number; sanskaras: number };
}

export interface TrainerNeeded {
  learning_id: number;
  trigger_summary: string;
  question_context: string;
}

export interface ChatResponse {
  manas: ManasOutput;
  buddhi: BuddhiOutput;
  sanskaras: SanskaraOutput;
  synthesis: SynthesisOutput;
  elapsed_ms: number;
  mode: "autonomous" | "needs_trainer";
  trainer_needed?: TrainerNeeded;
}

export interface HabitResponse {
  id: number;
  name: string;
  description: string;
  category: string;
  keywords: string;
  base_weight: number;
  repetition_count: number;
  effective_weight: number;
  valence: number;
}

export interface LearningResponse {
  id: number;
  trigger_summary: string;
  question_context: string;
  guidance: string;
  application_note: string;
  modules_informed: string;
  keywords: string;
  confidence_boost: number;
  times_applied: number;
  status: "pending" | "active" | "superseded";
}

export interface ConfigResponse {
  weight_manas: number;
  weight_buddhi: number;
  weight_sanskaras: number;
  claude_model: string;
  temperature: number;
  max_tokens: number;
  learning_mode_enabled: boolean;
  confidence_threshold: number;
}

// Streaming event types (SSE)
export type StreamEventType =
  | "start"
  | "manas"
  | "buddhi"
  | "sanskaras"
  | "confidence"
  | "synthesis"
  | "needs_trainer"
  | "done"
  | "error";

export interface StreamEvent<T = unknown> {
  type: StreamEventType;
  data: T;
}

// UI message state — what gets rendered in the chat
export type FacultyStatus = "waiting" | "loading" | "done" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "soul";
  text?: string;                       // user message text
  manas?: ManasOutput;
  buddhi?: BuddhiOutput;
  sanskaras?: SanskaraOutput;
  synthesis?: SynthesisOutput;
  elapsed_ms?: number;
  mode?: "autonomous" | "needs_trainer";
  trainer_needed?: TrainerNeeded;
  streaming?: boolean;
  // Per-faculty status during streaming
  manasStatus?: FacultyStatus;
  buddhiStatus?: FacultyStatus;
  sanskarasStatus?: FacultyStatus;
  synthesisStatus?: FacultyStatus;
  error?: string;
}

export type AppTab = "chat" | "trainer" | "habits" | "config";
