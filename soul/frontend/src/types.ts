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

export interface ChatResponse {
  manas: ManasOutput;
  buddhi: BuddhiOutput;
  sanskaras: SanskaraOutput;
  synthesis: SynthesisOutput;
  elapsed_ms: number;
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
}

export interface SoulConfig {
  backendUrl: string;
}
