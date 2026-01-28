/**
 * Stratus X1 API Client
 * OpenAI-compatible interface for Stratus reasoning API
 */

import { StratusConfig, StratusAPIResponse, RolloutRequest, RolloutResponse } from './types.js';

export class StratusClient {
  private config: StratusConfig;

  constructor(config: StratusConfig) {
    this.config = config;
  }

  /**
   * Call Stratus API with a prompt and system message
   */
  async query(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      // Add grader API keys if available
      if (this.config.anthropicApiKey) {
        headers['X-Anthropic-API-Key'] = this.config.anthropicApiKey;
      }
      if (this.config.openaiApiKey) {
        headers['X-OpenAI-API-Key'] = this.config.openaiApiKey;
      }

      const response = await fetch(`${this.config.apiUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'stratus-x1ac-xl-gpt-4o',  // Use XL model with GPT-4o grader for best accuracy
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.1, // Low temperature for accuracy
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stratus API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as StratusAPIResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from Stratus API');
      }

      return content;

    } catch (error: any) {
      throw new Error(`Stratus API error: ${error.message}`);
    }
  }

  /**
   * Parse JSON from Stratus response
   */
  parseJSON<T>(content: string): T {
    try {
      // Try to extract JSON from response (in case it's wrapped in text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse Stratus response: ${error}`);
    }
  }

  /**
   * Call the /v1/rollout endpoint for multi-step action prediction
   * This is a pure T-JEPA model endpoint (no LLM) for action sequence validation
   */
  async rollout(request: RolloutRequest): Promise<RolloutResponse> {
    try {
      const response = await fetch(`${this.config.apiUrl}/v1/rollout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          return_intermediate: true, // Always true to avoid known bug
          max_steps: 5,
          ...request,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stratus rollout API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as RolloutResponse;
      return data;

    } catch (error: any) {
      throw new Error(`Stratus rollout error: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.query(
        'You are a test assistant. Respond with exactly: {"status": "ok"}',
        'Health check'
      );
      const parsed = this.parseJSON<{ status: string }>(response);
      return parsed.status === 'ok';
    } catch (error) {
      return false;
    }
  }
}
