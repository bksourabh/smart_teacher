export interface ModuleOutput {
  module: string;
  response: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface ManasOutput extends ModuleOutput {
  module: "manas";
  valence: number;
}

export interface BuddhiOutput extends ModuleOutput {
  module: "buddhi";
  reasoning_chain: string[];
}

export interface SanskaraOutput extends ModuleOutput {
  module: "sanskaras";
  activated_habits: Array<{
    name: string;
    weight: number;
    influence: string;
  }>;
}

export interface SynthesisOutput {
  response: string;
  weights: Record<string, number>;
}

export interface TrainerConsultationNeeded {
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
  trainer_needed?: TrainerConsultationNeeded;
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
  status: string;
}

export interface TrainerGuidanceRequest {
  guidance: string;
  application_note: string;
  modules_informed?: string;
  confidence_boost?: number;
}

export interface TrainerLearningCreate {
  trigger_summary: string;
  question_context?: string;
  keywords: string;
  guidance: string;
  application_note: string;
  modules_informed?: string;
  confidence_boost?: number;
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

export interface SoulConfig {
  backendUrl: string;
}
