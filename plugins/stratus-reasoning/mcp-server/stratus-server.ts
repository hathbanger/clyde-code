#!/usr/bin/env node
/**
 * Stratus X1 MCP Server
 * Exposes Stratus reasoning tools to Claude Code via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { StratusClient } from './src/stratus-client.js';
import { stratusCount, TOOL_DEFINITION as COUNT_TOOL } from './src/tools/count.js';
import { stratusVerify, TOOL_DEFINITION as VERIFY_TOOL } from './src/tools/verify.js';
import { stratusAnalyze, TOOL_DEFINITION as ANALYZE_TOOL } from './src/tools/analyze.js';
import { stratusCompress, TOOL_DEFINITION as COMPRESS_TOOL } from './src/tools/compress.js';
import { stratusPlan, TOOL_DEFINITION as PLAN_TOOL } from './src/tools/plan.js';
import { stratusRollout, TOOL_DEFINITION as ROLLOUT_TOOL } from './src/tools/rollout.js';
import { loadConfig, getAuthSetupMessage } from './src/config.js';

// Load configuration
const config = loadConfig();

if (!config) {
  console.error(getAuthSetupMessage());
  process.exit(1);
}

const STRATUS_API_KEY = config.apiKey;
const STRATUS_API_URL = config.apiUrl;

// Initialize Stratus client
const stratusClient = new StratusClient({
  apiKey: STRATUS_API_KEY,
  apiUrl: STRATUS_API_URL,
});

// Create MCP server
const server = new Server(
  {
    name: 'stratus-reasoning',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      COUNT_TOOL,
      VERIFY_TOOL,
      ANALYZE_TOOL,
      COMPRESS_TOOL,
      PLAN_TOOL,
      ROLLOUT_TOOL,
    ],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: 'text', text: 'Error: No arguments provided' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'stratus_count': {
        const result = await stratusCount(
          stratusClient,
          args.text as string,
          args.pattern as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'stratus_verify': {
        const result = await stratusVerify(
          stratusClient,
          args.statement as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'stratus_analyze': {
        const result = await stratusAnalyze(
          stratusClient,
          args.data as string,
          args.query as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'stratus_compress': {
        const result = await stratusCompress(
          stratusClient,
          args.long_text as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'stratus_plan': {
        const result = await stratusPlan(
          stratusClient,
          args.current_state as string,
          args.goal as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'stratus_rollout': {
        const result = await stratusRollout(
          stratusClient,
          args.goal as string,
          args.max_steps as number | undefined,
          args.actions as number[] | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  Stratus X1 MCP Server');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`  API URL: ${STRATUS_API_URL}`);
  console.error(`  API Key: ${STRATUS_API_KEY.substring(0, 20)}...`);
  console.error('');

  // Health check
  console.error('  Verifying connection...');
  const startTime = Date.now();
  const healthy = await stratusClient.healthCheck();
  const duration = Date.now() - startTime;

  if (!healthy) {
    console.error('  ❌ Stratus API health check failed');
    console.error('  WARNING: Tools may not work correctly.');
    console.error('  Run: npm run health (to diagnose)');
    console.error('');
  } else {
    console.error(`  ✓ API connected (${duration}ms)`);
    console.error('');
  }

  console.error('  Registered tools:');
  console.error('    • stratus_count     - Accurate counting');
  console.error('    • stratus_verify    - Mathematical verification');
  console.error('    • stratus_analyze   - Pattern analysis');
  console.error('    • stratus_compress  - Long-context compression');
  console.error('    • stratus_plan      - Multi-step planning (LLM)');
  console.error('    • stratus_rollout   - Action sequence prediction (T-JEPA)');
  console.error('');

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('  ✓ Server ready and listening');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
