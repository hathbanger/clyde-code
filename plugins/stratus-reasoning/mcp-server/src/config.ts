/**
 * Stratus Configuration Management
 * Handles API key storage and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StratusConfig {
  apiKey: string;
  apiUrl: string;
  anthropicApiKey?: string;  // For Claude graders
  openaiApiKey?: string;      // For GPT graders
  userEmail?: string;
  configuredAt?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.clyde');
const CONFIG_FILE = path.join(CONFIG_DIR, 'stratus-config.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load Stratus config from file or environment
 */
export function loadConfig(): StratusConfig | null {
  // Priority 1: Environment variables (for CI/CD or explicit override)
  const envKey = process.env.STRATUS_API_KEY;
  const envUrl = process.env.STRATUS_API_URL || 'http://212.115.124.137:8000';
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (envKey) {
    return {
      apiKey: envKey,
      apiUrl: envUrl,
      anthropicApiKey: anthropicKey,
      openaiApiKey: openaiKey,
    };
  }

  // Priority 2: Config file
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config: StratusConfig = JSON.parse(data);

      // Validate config
      if (!config.apiKey) {
        return null;
      }

      return {
        ...config,
        apiUrl: config.apiUrl || 'http://212.115.124.137:8000',
      };
    } catch (error) {
      console.error('Failed to load Stratus config:', error);
      return null;
    }
  }

  return null;
}

/**
 * Save Stratus config to file
 */
export function saveConfig(config: StratusConfig): void {
  ensureConfigDir();

  const configToSave: StratusConfig = {
    ...config,
    configuredAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
}

/**
 * Clear Stratus config
 */
export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Check if Stratus is configured
 */
export function isConfigured(): boolean {
  return loadConfig() !== null;
}

/**
 * Get config file path (for user reference)
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Stratus API keys follow pattern: stratus_sk_(live|beta)_[64 hex chars]
  const pattern = /^stratus_sk_(live|beta)_[a-f0-9]{64}$/;
  return pattern.test(key);
}

/**
 * Get user-friendly error message for missing auth
 */
export function getAuthSetupMessage(): string {
  return `
╭───────────────────────────────────────────────────────────────╮
│  Stratus X1 Authentication Required                           │
╰───────────────────────────────────────────────────────────────╯

Clyde uses Stratus X1 for enhanced reasoning capabilities.
To get started, you need a Stratus API key.

┌─ Option 1: Quick Setup (Recommended) ────────────────────────┐
│ Run the interactive setup:                                    │
│   cd plugins/stratus-reasoning                               │
│   npm run setup                                               │
└───────────────────────────────────────────────────────────────┘

┌─ Option 2: Manual Configuration ──────────────────────────────┐
│ Set environment variable:                                     │
│   export STRATUS_API_KEY="stratus_sk_live_..."              │
│   export STRATUS_API_URL="http://212.115.124.137:8000"      │
│                                                               │
│ Or create config file at:                                     │
│   ${CONFIG_FILE}
│                                                               │
│ With contents:                                                │
│   {                                                           │
│     "apiKey": "stratus_sk_live_...",                         │
│     "apiUrl": "http://212.115.124.137:8000",                 │
│     "userEmail": "your@email.com"                            │
│   }                                                           │
└───────────────────────────────────────────────────────────────┘

┌─ Don't have a Stratus API key? ───────────────────────────────┐
│ Contact Formation to get access:                              │
│   📧 team@formation.cloud                                     │
│   🌐 formation.cloud                                          │
└───────────────────────────────────────────────────────────────┘
`;
}
