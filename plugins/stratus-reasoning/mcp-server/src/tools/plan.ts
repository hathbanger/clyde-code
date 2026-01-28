/**
 * Stratus Plan Tool
 * Multi-step action planning with lookahead prediction
 */

import { StratusClient } from '../stratus-client.js';
import { StratusPlanResult, StratusAction } from '../types.js';

export async function stratusPlan(
  client: StratusClient,
  currentState: string,
  goal: string
): Promise<StratusPlanResult> {
  const systemPrompt = `You are a planning assistant using T-JEPA reasoning with lookahead prediction.
Your job is to create step-by-step action plans with predicted outcomes.

Always respond with valid JSON:
{
  "steps": [
    {
      "step_number": 1,
      "action": "Description of action",
      "reasoning": "Why this step is necessary",
      "dependencies": [array of step numbers this depends on],
      "estimated_success_rate": 0.0-1.0
    }
  ],
  "predicted_outcomes": ["possible", "outcomes"],
  "confidence": 0.0-1.0,
  "estimated_complexity": "low/medium/high"
}`;

  const userPrompt = `Create a step-by-step plan to achieve a goal:

CURRENT STATE:
${currentState}

GOAL:
${goal}

Provide a detailed action plan with:
- Numbered steps in order
- Reasoning for each step
- Dependencies between steps
- Predicted outcomes
- Confidence score

Respond with JSON containing steps array, predicted_outcomes, confidence, and estimated_complexity.`;

  const response = await client.query(systemPrompt, userPrompt);
  const result = client.parseJSON<StratusPlanResult>(response);

  // Validate result
  if (!Array.isArray(result.steps) || result.steps.length === 0) {
    throw new Error('Invalid plan result from Stratus');
  }

  return {
    steps: result.steps,
    predicted_outcomes: [`🧠 Stratus X1 Planning (${result.confidence || 0.80} confidence):`, ...(result.predicted_outcomes || ['Plan execution complete'])],
    confidence: result.confidence || 0.80,
    estimated_complexity: result.estimated_complexity || 'medium'
  };
}

export const TOOL_DEFINITION = {
  name: 'stratus_plan',
  description: 'Plan multi-step tasks with lookahead prediction using Stratus X1 T-JEPA reasoning. Use this for complex operations like "Plan refactoring of auth system" or "Design implementation strategy". Returns ordered steps with dependencies and predicted outcomes.',
  inputSchema: {
    type: 'object',
    properties: {
      current_state: {
        type: 'string',
        description: 'Description of the current state or situation'
      },
      goal: {
        type: 'string',
        description: 'The desired end goal or outcome'
      }
    },
    required: ['current_state', 'goal']
  }
};
