/**
 * Stratus Verify Tool
 * Mathematical and logical verification using T-JEPA reasoning
 */

import { StratusClient } from '../stratus-client.js';
import { StratusVerifyResult } from '../types.js';

export async function stratusVerify(
  client: StratusClient,
  statement: string
): Promise<StratusVerifyResult> {
  const systemPrompt = `You are a mathematical and logical verification assistant using T-JEPA reasoning.
Your job is to verify statements with proofs or logical reasoning.

Always respond with valid JSON:
{
  "valid": true/false,
  "reasoning": "Detailed explanation of your verification process",
  "confidence": 0.0-1.0,
  "proof": "Optional mathematical proof or logical chain"
}`;

  const userPrompt = `Verify the following statement:

STATEMENT: "${statement}"

Determine if this statement is true or false. Provide reasoning and proof if applicable.
Respond with JSON containing valid (boolean), reasoning, confidence, and optional proof.`;

  const response = await client.query(systemPrompt, userPrompt);
  const result = client.parseJSON<StratusVerifyResult>(response);

  // Validate result
  if (typeof result.valid !== 'boolean') {
    throw new Error('Invalid verify result from Stratus');
  }

  return {
    valid: result.valid,
    reasoning: `🧠 Stratus X1: ${result.reasoning || 'Verification completed'}`,
    confidence: result.confidence || 0.95,
    proof: result.proof ? `${result.proof}` : undefined
  };
}

export const TOOL_DEFINITION = {
  name: 'stratus_verify',
  description: 'Verify mathematical or logical statements using Stratus X1 T-JEPA reasoning. Use this for verification tasks like "Is 8191 a prime number?" or "Is this logic valid?". Returns boolean validity with detailed reasoning and optional proof.',
  inputSchema: {
    type: 'object',
    properties: {
      statement: {
        type: 'string',
        description: 'The mathematical or logical statement to verify'
      }
    },
    required: ['statement']
  }
};
