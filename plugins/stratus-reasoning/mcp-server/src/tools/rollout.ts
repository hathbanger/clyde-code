/**
 * Stratus Rollout Tool
 * Multi-step action prediction using pure T-JEPA model (no LLM)
 *
 * Use this for:
 * - Action sequence validation
 * - Path comparison
 * - "What-if" analysis
 * - Goal achievement estimation
 */

import { StratusClient } from '../stratus-client.js';
import { RolloutResponse } from '../types.js';

export async function stratusRollout(
  client: StratusClient,
  goal: string,
  maxSteps?: number,
  actions?: number[]
): Promise<RolloutResponse> {
  const request = {
    goal,
    max_steps: maxSteps || 5,
    ...(actions && { actions }),
  };

  const response = await client.rollout(request);
  return response;
}

export const TOOL_DEFINITION = {
  name: 'stratus_rollout',
  description: 'Predict multi-step action sequences using Stratus T-JEPA model (no LLM, 2-5s). Given a goal, predicts what actions will be taken, state transitions, and whether the goal will be achieved. Perfect for validating plans, comparing paths, or "what-if" analysis. Returns structured predictions with confidence scores.',
  inputSchema: {
    type: 'object',
    properties: {
      goal: {
        type: 'string',
        description: 'Natural language description of the goal (e.g., "Find and book a hotel in San Francisco")'
      },
      max_steps: {
        type: 'number',
        description: 'Maximum steps to predict (default: 5, max: 10). Latency scales linearly.',
      },
      actions: {
        type: 'array',
        items: {
          type: 'number'
        },
        description: 'Optional: Explicit action IDs (0-66) to validate specific sequence. Overrides automatic planning.'
      }
    },
    required: ['goal']
  }
};
