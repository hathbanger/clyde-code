#!/usr/bin/env node
/**
 * Stratus X1 Interactive Setup
 * Guides users through authentication configuration
 */

import * as readline from 'readline';
import { saveConfig, loadConfig, isValidApiKeyFormat, getConfigPath } from './src/config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log(`
╭───────────────────────────────────────────────────────────────╮
│  ✨ Clyde + Stratus X1 Setup                                  │
╰───────────────────────────────────────────────────────────────╯

Welcome! Let's get your Stratus X1 authentication configured.
`);

  // Check if already configured
  const existingConfig = loadConfig();
  if (existingConfig) {
    console.log('⚠️  Stratus is already configured!\n');
    console.log(`Current API key: ${existingConfig.apiKey.substring(0, 20)}...`);
    console.log(`API URL: ${existingConfig.apiUrl}`);
    if (existingConfig.userEmail) {
      console.log(`Email: ${existingConfig.userEmail}`);
    }
    console.log('');

    const reconfigure = await question('Do you want to reconfigure? (y/N): ');
    if (reconfigure.toLowerCase() !== 'y') {
      console.log('\n✅ Keeping existing configuration.');
      rl.close();
      return;
    }
    console.log('');
  }

  // Step 1: Get API Key
  console.log('┌─ Step 1: Stratus API Key ─────────────────────────────────────┐');
  console.log('│ Your Stratus API key should look like:                        │');
  console.log('│   stratus_sk_live_1234567890abcdef...                         │');
  console.log('│                                                                │');
  console.log('│ Don\'t have one? Contact Formation:                            │');
  console.log('│   📧 team@formation.cloud                                      │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  let apiKey = '';
  let validKey = false;

  while (!validKey) {
    apiKey = await question('Enter your Stratus API key: ');
    apiKey = apiKey.trim();

    if (!apiKey) {
      console.log('❌ API key is required.\n');
      continue;
    }

    if (!isValidApiKeyFormat(apiKey)) {
      console.log('❌ Invalid API key format. Expected: stratus_sk_(live|beta)_[64 hex chars]\n');
      const retry = await question('Try again? (Y/n): ');
      if (retry.toLowerCase() === 'n') {
        console.log('\n❌ Setup cancelled.');
        rl.close();
        return;
      }
      continue;
    }

    validKey = true;
  }

  // Step 2: API URL (optional, has default)
  console.log('\n┌─ Step 2: Stratus API URL ─────────────────────────────────────┐');
  console.log('│ Default: http://212.115.124.137:8000                          │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  const customUrl = await question('Use custom API URL? (leave empty for default): ');
  const apiUrl = customUrl.trim() || 'http://212.115.124.137:8000';

  // Step 3: User Email (optional)
  console.log('\n┌─ Step 3: Your Email (Optional) ───────────────────────────────┐');
  console.log('│ This helps us provide better support.                         │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  const userEmail = await question('Your email (optional): ');

  // Step 4: Validate API key by testing connection
  console.log('\n┌─ Step 4: Testing Connection... ───────────────────────────────┐');
  console.log('│ Verifying your API key works...                               │');

  const testResult = await testApiKey(apiKey, apiUrl);

  if (!testResult.success) {
    console.log('│ ❌ Connection failed                                           │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');
    console.log(`Error: ${testResult.error}`);
    console.log('\nPossible issues:');
    console.log('  - API key is invalid or revoked');
    console.log('  - API server is down');
    console.log('  - Network connectivity issue');

    const saveAnyway = await question('\nSave configuration anyway? (y/N): ');
    if (saveAnyway.toLowerCase() !== 'y') {
      console.log('\n❌ Setup cancelled.');
      rl.close();
      return;
    }
  } else {
    console.log('│ ✅ Connection successful!                                      │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');
  }

  // Step 5: Save configuration
  try {
    saveConfig({
      apiKey,
      apiUrl,
      userEmail: userEmail.trim() || undefined,
    });

    console.log('╭───────────────────────────────────────────────────────────────╮');
    console.log('│  ✅ Configuration Saved Successfully!                         │');
    console.log('╰───────────────────────────────────────────────────────────────╯\n');
    console.log(`Config saved to: ${getConfigPath()}\n`);
    console.log('You can now use Clyde with Stratus X1 reasoning! 🚀\n');
    console.log('Try it out:');
    console.log('  1. Start Clyde in your project: clyde');
    console.log('  2. Use Stratus tools: "Use stratus_count to count \'r\' in \'strawberry\'"');
    console.log('  3. Expected result: 3 (correct!) ✅\n');
  } catch (error: any) {
    console.log('❌ Failed to save configuration:', error.message);
  }

  rl.close();
}

/**
 * Test API key by making a health check request
 */
async function testApiKey(apiKey: string, apiUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'stratus-v3-base',
        messages: [
          {
            role: 'system',
            content: 'You are a test assistant. Respond with exactly: {"status": "ok"}'
          },
          {
            role: 'user',
            content: 'Health check'
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API returned status ${response.status}`,
      };
    }

    const data = await response.json() as any;
    if (data.choices?.[0]?.message?.content) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid API response format',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run setup
main().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
