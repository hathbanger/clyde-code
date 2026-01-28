/**
 * Stratus Count Tool
 * Accurate counting and enumeration using T-JEPA reasoning
 */

import { StratusClient } from '../stratus-client.js';
import { StratusCountResult } from '../types.js';

export async function stratusCount(
  client: StratusClient,
  text: string,
  pattern: string
): Promise<StratusCountResult> {
  const systemPrompt = `You are a precise counting assistant using T-JEPA reasoning.
Your job is to count occurrences of a pattern in text with 100% accuracy.

Always respond with valid JSON:
{
  "count": number,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your counting process"
}`;

  const userPrompt = `Count how many times the pattern "${pattern}" appears in the following text:

TEXT: "${text}"

Count each occurrence carefully. Respond with JSON containing the count, confidence (0-1), and reasoning.`;

  const response = await client.query(systemPrompt, userPrompt);
  const result = client.parseJSON<StratusCountResult>(response);

  // Validate result
  if (typeof result.count !== 'number' || result.count < 0) {
    throw new Error('Invalid count result from Stratus');
  }

  return {
    count: result.count,
    confidence: result.confidence || 0.99,
    reasoning: `🧠 Stratus X1 (XL): ${result.reasoning || 'Count completed successfully'}`
  };
}

export const TOOL_DEFINITION = {
  name: 'stratus_count',
  description: 'Accurately count occurrences of a pattern in text using Stratus X1 T-JEPA reasoning. Use this for counting tasks where 100% accuracy is required (e.g., "How many times does the letter \'r\' appear in \'strawberry\'?"). Returns count with confidence score.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to search within'
      },
      pattern: {
        type: 'string',
        description: 'The pattern/substring to count (case-sensitive)'
      }
    },
    required: ['text', 'pattern']
  }
};
