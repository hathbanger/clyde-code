/**
 * Stratus X1 API Types
 */

export interface StratusConfig {
  apiKey: string;
  apiUrl: string;
  anthropicApiKey?: string;  // For Claude graders
  openaiApiKey?: string;      // For GPT graders
}

export interface StratusCountResult {
  count: number;
  confidence: number;
  reasoning?: string;
}

export interface StratusVerifyResult {
  valid: boolean;
  reasoning: string;
  confidence: number;
  proof?: string;
}

export interface StratusAnalyzeResult {
  patterns: string[];
  insights: string;
  confidence: number;
}

export interface StratusCompressResult {
  compressed_summary: string;
  compression_ratio: number;
  key_points: string[];
  original_tokens?: number;
  compressed_tokens?: number;
}

export interface StratusPlanResult {
  steps: StratusAction[];
  predicted_outcomes: string[];
  confidence: number;
  estimated_complexity?: string;
}

export interface StratusAction {
  step_number: number;
  action: string;
  reasoning: string;
  dependencies?: number[];
  estimated_success_rate?: number;
}

export interface StratusAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Rollout endpoint types
export interface RolloutRequest {
  goal: string;
  max_steps?: number;
  actions?: number[];
  return_intermediate?: boolean;
  initial_state?: string;
}

export interface ActionStep {
  step: number;
  action_id: number;
  action_name: string;
  action_category: string;
}

export interface StateInfo {
  step: number;
  magnitude: number;
  confidence: "High" | "Medium" | "Low";
}

export interface Prediction {
  step: number;
  action: ActionStep;
  current_state: StateInfo;
  predicted_state: StateInfo;
  state_change: number;
  interpretation: string;
}

export interface Summary {
  total_steps: number;
  initial_magnitude: number;
  final_magnitude: number;
  total_state_change: number;
  outcome: string;
  action_path: string[];
}

export interface RolloutResponse {
  id: string;
  object: string;
  created: number;
  goal: string;
  initial_state: string;
  action_sequence: ActionStep[];
  predictions?: Prediction[];
  summary: Summary;
}
