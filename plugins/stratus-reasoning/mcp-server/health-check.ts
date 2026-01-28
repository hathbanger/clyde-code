#!/usr/bin/env node
/**
 * Stratus X1 Health Check
 * Tests connectivity to Stratus API and validates configuration
 */

import { StratusClient } from './src/stratus-client.js';
import { loadConfig } from './src/config.js';

async function healthCheck() {
  console.log('🔍 Stratus X1 Health Check\n');

  // Check configuration
  console.log('1. Checking configuration...');
  const config = loadConfig();

  if (!config) {
    console.error('   ❌ No configuration found');
    console.error('   Run: npm run setup');
    process.exit(1);
  }

  console.log(`   ✓ Config loaded from ${config.apiKey ? 'environment/file' : 'unknown'}`);
  console.log(`   ✓ API URL: ${config.apiUrl}`);
  console.log(`   ✓ API Key: ${config.apiKey.substring(0, 20)}...`);

  // Test API connectivity
  console.log('\n2. Testing API connectivity...');
  const client = new StratusClient(config);

  try {
    const startTime = Date.now();
    const healthy = await client.healthCheck();
    const duration = Date.now() - startTime;

    if (healthy) {
      console.log(`   ✓ API is reachable (${duration}ms)`);
      console.log('\n✅ Stratus X1 is ready to use!');
      process.exit(0);
    } else {
      console.error('   ❌ API health check failed');
      console.error('   The API responded but returned an unexpected result');
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ Cannot reach API: ${error.message}`);
    console.error('\n   Possible issues:');
    console.error('   - Check your internet connection');
    console.error('   - Verify the API URL is correct');
    console.error('   - Confirm your API key is valid');
    console.error(`   - Try: curl -H "Authorization: Bearer ${config.apiKey}" ${config.apiUrl}/v1/chat/completions`);
    process.exit(1);
  }
}

healthCheck();
