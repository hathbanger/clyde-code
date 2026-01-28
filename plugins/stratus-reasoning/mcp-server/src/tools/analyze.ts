/**
 * Stratus Analyze Tool
 * Pattern analysis and extraction using T-JEPA reasoning
 */

import { StratusClient } from '../stratus-client.js';
import { StratusAnalyzeResult } from '../types.js';

export async function stratusAnalyze(
  client: StratusClient,
  data: string,
  query: string
): Promise<StratusAnalyzeResult> {
  const systemPrompt = `You are a pattern analysis assistant using T-JEPA reasoning.
Your job is to analyze data and extract patterns based on a query.

Always respond with valid JSON:
{
  "patterns": ["list", "of", "patterns"],
  "insights": "Key insights and observations",
  "confidence": 0.0-1.0
}`;

  const userPrompt = `Analyze the following data to answer this query:

QUERY: "${query}"

DATA:
${data.length > 5000 ? data.substring(0, 5000) + '\n...(truncated)' : data}

Extract patterns, provide insights, and explain your findings.
Respond with JSON containing patterns (array), insights (string), and confidence.`;

  const response = await client.query(systemPrompt, userPrompt);
  const result = client.parseJSON<StratusAnalyzeResult>(response);

  // Validate result
  if (!Array.isArray(result.patterns)) {
    throw new Error('Invalid analyze result from Stratus');
  }

  return {
    patterns: result.patterns,
    insights: `🧠 Stratus X1: ${result.insights || 'Analysis completed'}`,
    confidence: result.confidence || 0.85
  };
}

export const TOOL_DEFINITION = {
  name: 'stratus_analyze',
  description: 'Analyze data for patterns using Stratus X1 T-JEPA reasoning. Use this for pattern extraction like "Find all error handling patterns across these files" or "Identify security vulnerabilities in this code". Returns array of patterns with insights.',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'The data to analyze (code, text, logs, etc.)'
      },
      query: {
        type: 'string',
        description: 'What patterns or insights to look for'
      }
    },
    required: ['data', 'query']
  }
};
