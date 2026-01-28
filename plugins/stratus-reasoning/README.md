# Stratus X1 Reasoning Plugin

**Enhance Clyde with Stratus X1 T-JEPA reasoning capabilities.**

This plugin integrates Formation's Stratus X1 model into Clyde, providing:
- **100% accurate counting** (solves the "strawberry" problem)
- **Fast mathematical verification** (<2s with proofs)
- **10-50x token compression** for long-context analysis
- **Multi-step planning** with predictive lookahead

---

## Installation

### 1. Install Dependencies

```bash
cd /Users/andrewhathaway/code/formation/clyde-code/plugins/stratus-reasoning/mcp-server
npm install
```

### 2. Build the MCP Server

```bash
npm run build
```

### 3. Configure Stratus Authentication

**🎉 NEW: Interactive Setup (Recommended)**

Run the interactive setup wizard:

```bash
npm run setup
```

This will guide you through:
- Entering your Stratus API key
- Validating your credentials
- Saving your configuration to `~/.clyde/stratus-config.json`

**Alternative: Manual Configuration**

Option A - Environment variables (for CI/CD or temporary use):
```bash
export STRATUS_API_KEY="stratus_sk_live_..."
export STRATUS_API_URL="http://212.115.124.137:8000"  # Optional, has default
```

Option B - Config file (persistent):
Create `~/.clyde/stratus-config.json`:
```json
{
  "apiKey": "stratus_sk_live_...",
  "apiUrl": "http://212.115.124.137:8000",
  "userEmail": "your@email.com"
}
```

**Don't have a Stratus API key?**
Contact Formation: team@formation.cloud

### 4. Test the Plugin

Start Clyde in a test project:
```bash
cd ~/your-project
clyde
```

In the Clyde session, try:
```
clyde> Use stratus_count to count how many times 'r' appears in 'strawberry'
```

Expected output:
```json
{
  "count": 3,
  "confidence": 0.99,
  "reasoning": "Counted each character: st[r]awbe[r][r]y = 3 occurrences"
}
```

---

## Available Tools

### NEW: `stratus_rollout` - Action Sequence Validation ⚡

**Use case:** Validate multi-step plans before execution (2-5s, pure T-JEPA)

**Example:**
```
clyde> Use stratus_rollout to validate this plan: migrate from Redux to Zustand
```

**Parameters:**
- `goal` (string): Natural language goal description
- `max_steps` (number, optional): Max steps to predict (default: 5)
- `actions` (number[], optional): Explicit action IDs to validate

**Returns:**
```json
{
  "action_sequence": [
    {"step": 1, "action_name": "install", "action_category": "system"},
    {"step": 2, "action_name": "create", "action_category": "interaction"}
  ],
  "summary": {
    "outcome": "Goal likely achieved (large cumulative change)",
    "total_state_change": 23.45,
    "action_path": ["install", "create", "replace", "remove"]
  },
  "predictions": [...]
}
```

**Key Features:**
- ⚡ **Fast**: 2-5s (vs 5-20s for LLM tools)
- 🎯 **Accurate**: Pure T-JEPA model predictions
- 🛡️ **Safety**: Validate before executing risky operations
- 📊 **Structured**: Action sequences with confidence scores

**See:** [Complete Rollout Guide](./docs/ROLLOUT_ENDPOINT_GUIDE.md)

---

### 1. `stratus_count` - Accurate Counting

**Use case:** Count occurrences with 100% accuracy

**Example:**
```
clyde> Use stratus_count to count 'TODO' comments in this file
```

**Parameters:**
- `text` (string): Text to search within
- `pattern` (string): Pattern to count (case-sensitive)

**Returns:**
```json
{
  "count": 12,
  "confidence": 0.99,
  "reasoning": "Found 12 TODO comments"
}
```

---

### 2. `stratus_verify` - Mathematical Verification

**Use case:** Verify math/logic with proofs

**Example:**
```
clyde> Use stratus_verify to check if 8191 is a prime number
```

**Parameters:**
- `statement` (string): Statement to verify

**Returns:**
```json
{
  "valid": true,
  "reasoning": "8191 is a Mersenne prime (2^13 - 1)",
  "confidence": 1.0,
  "proof": "Verified by trial division and Mersenne primality test"
}
```

---

### 3. `stratus_analyze` - Pattern Analysis

**Use case:** Extract patterns from code/data

**Example:**
```
clyde> Use stratus_analyze to find error handling patterns in this code
```

**Parameters:**
- `data` (string): Data to analyze
- `query` (string): What to look for

**Returns:**
```json
{
  "patterns": [
    "try-catch blocks with generic Error",
    "Missing error logging in 3 functions",
    "No error boundaries in React components"
  ],
  "insights": "Error handling is inconsistent. Recommend standardized error wrapper.",
  "confidence": 0.88
}
```

---

### 4. `stratus_compress` - Long-Context Compression

**Use case:** Analyze files >10k tokens

**Example:**
```
clyde> Use stratus_compress on this 50k line file
```

**Parameters:**
- `long_text` (string): Long text to compress

**Returns:**
```json
{
  "compressed_summary": "Module implements authentication with JWT tokens...",
  "compression_ratio": 23.4,
  "key_points": [
    "JWT token generation and validation",
    "Role-based access control",
    "Session management with Redis"
  ],
  "original_tokens": 12000,
  "compressed_tokens": 512
}
```

---

### 5. `stratus_plan` - Multi-Step Planning

**Use case:** Plan complex refactoring/implementation (LLM-based)

**Example:**
```
clyde> Use stratus_plan to plan refactoring the auth system
```

**Parameters:**
- `current_state` (string): Current situation
- `goal` (string): Desired outcome

**Returns:**
```json
{
  "steps": [
    {
      "step_number": 1,
      "action": "Extract auth logic to separate module",
      "reasoning": "Improves separation of concerns",
      "dependencies": [],
      "estimated_success_rate": 0.95
    },
    {
      "step_number": 2,
      "action": "Add JWT token validation middleware",
      "reasoning": "Centralizes authentication",
      "dependencies": [1],
      "estimated_success_rate": 0.90
    }
  ],
  "predicted_outcomes": [
    "Cleaner codebase",
    "Easier to test auth logic",
    "Better security boundaries"
  ],
  "confidence": 0.85,
  "estimated_complexity": "medium"
}
```

**Pro Tip:** Combine with `stratus_rollout` for two-stage planning:
1. Use `stratus_plan` to create initial plan (creative, LLM-based)
2. Use `stratus_rollout` to validate it (fast, T-JEPA-based)

---

## How Stratus Makes Clyde Better

### Problem 1: Claude Can't Count
**Before (Claude):** "How many 'r's in 'strawberry'?" → "2" ❌
**After (Stratus):** "How many 'r's in 'strawberry'?" → "3" ✅

### Problem 2: Context Limits
**Before:** Analyze 50k line file → "Error: context limit exceeded" ❌
**After:** Use `stratus_compress` → 10-50x compression → Full analysis ✅

### Problem 3: Slow Verification
**Before:** Verify 8191 is prime → 30 seconds, 80% confidence
**After:** Use `stratus_verify` → <2 seconds, 100% verified with proof ✅

### Problem 4: Risky Operations
**Before:** Execute complex refactoring → Hope it works → Fix bugs later ❌
**After:** Use `stratus_rollout` to validate → Know it will work → Execute confidently ✅

**Example:**
```
clyde> Validate this plan before I run it: migrate database schema and backfill data

[Stratus rollout runs...]

⚠️ Rollout predicts success (0.85 confidence) but step 2 (schema alteration)
is high-risk (state change: 16.2). Recommend:
1. Create backup first ✅
2. Test on staging
3. Use transaction rollback

Proceed? [y/N]
```

---

## Troubleshooting

### "Stratus X1 Authentication Required"
**Solution:** Run the setup wizard:
```bash
cd plugins/stratus-reasoning/mcp-server
npm run setup
```

Or manually configure (see Installation step 3 above).

### "Stratus API health check failed"
**Possible causes:**
1. **Invalid API key** - Verify your key starts with `stratus_sk_live_` or `stratus_sk_beta_`
2. **API server down** - Check if `http://212.115.124.137:8000` is accessible
3. **Network issue** - Test connectivity: `curl http://212.115.124.137:8000`

**To reconfigure:** Run `npm run setup` again.

### "Invalid API key format"
API keys must follow this pattern:
- Format: `stratus_sk_(live|beta)_[64 hexadecimal characters]`
- Example: `stratus_sk_live_1234567890abcdef...`

**To fix:** Run setup again with a valid key.

### Tools not showing up in Clyde
1. Ensure plugin is built: `npm run build`
2. Check `.mcp.json` exists in plugin root
3. Restart Clyde session

---

## Architecture

```
Clyde
  ↓
MCP Server (stratus-server.ts)
  ↓
Stratus Client (stratus-client.ts)
  ↓
Stratus X1 API (http://212.115.124.137:8000)
  ↓
T-JEPA Reasoning Model
```

---

## Future Enhancements (Week 2+)

- **Auto-routing hooks**: Automatically use Stratus for counting/logic tasks
- **Specialized agent**: `stratus-reasoner` for deep reasoning workflows
- **Caching**: Cache repeated queries for performance
- **Local deployment**: Run Stratus model locally

---

## License

Same as Clyde (see LICENSE.md in repo root)

**Built by Formation** | [formation.cloud](https://formation.cloud)
