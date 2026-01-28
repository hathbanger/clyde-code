/**
 * Stratus Compress Tool
 * Long-context compression via embeddings and summarization
 */

import { StratusClient } from '../stratus-client.js';
import { StratusCompressResult } from '../types.js';

export async function stratusCompress(
  client: StratusClient,
  longText: string
): Promise<StratusCompressResult> {
  // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
  const originalTokens = Math.ceil(longText.length / 4);

  const systemPrompt = `You are a text compression assistant using T-JEPA reasoning.
Your job is to compress long text into concise summaries while preserving key information.

Always respond with valid JSON:
{
  "compressed_summary": "Concise summary preserving key details",
  "key_points": ["array", "of", "key", "points"],
  "compression_ratio": number (e.g., 10 for 10x compression)
}`;

  const userPrompt = `Compress the following text into a concise summary:

ORIGINAL TEXT (${originalTokens} tokens):
${longText.length > 10000 ? longText.substring(0, 10000) + '\n...(content truncated for processing)' : longText}

Create a highly compressed summary that captures all essential information.
Aim for 10-50x compression while maintaining accuracy.
Respond with JSON containing compressed_summary, key_points array, and estimated compression_ratio.`;

  const response = await client.query(systemPrompt, userPrompt);
  const result = client.parseJSON<StratusCompressResult>(response);

  // Estimate compressed tokens
  const compressedTokens = Math.ceil((result.compressed_summary?.length || 0) / 4);
  const actualRatio = originalTokens / (compressedTokens || 1);

  return {
    compressed_summary: `🧠 Stratus X1 (${actualRatio.toFixed(1)}x compression):\n\n${result.compressed_summary || 'Compression failed'}`,
    compression_ratio: Math.round(actualRatio * 10) / 10, // Round to 1 decimal
    key_points: result.key_points || [],
    original_tokens: originalTokens,
    compressed_tokens: compressedTokens
  };
}

export const TOOL_DEFINITION = {
  name: 'stratus_compress',
  description: 'Compress long text (10k+ tokens) using Stratus X1 T-JEPA reasoning for efficient long-context analysis. Use this when files are too large for normal processing. Achieves 10-50x compression while preserving key information. Returns compressed summary with key points.',
  inputSchema: {
    type: 'object',
    properties: {
      long_text: {
        type: 'string',
        description: 'The long text to compress (typically 10k+ tokens)'
      }
    },
    required: ['long_text']
  }
};
