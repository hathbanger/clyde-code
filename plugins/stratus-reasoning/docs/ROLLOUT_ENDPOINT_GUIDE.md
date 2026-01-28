# Stratus /v1/rollout Endpoint - Complete Guide

**Status:** ✅ Deployed & Tested
**Server:** http://212.115.124.137:8000
**Model:** stratus-v3-base (290.4M params, checkpoint 164500)
**Date:** January 28, 2026

## Overview

The `/v1/rollout` endpoint provides **multi-step action prediction** - simulate future states before execution. Given a goal or action sequence, Stratus predicts:

1. What actions will be taken
2. What state changes will occur
3. Confidence scores for each step
4. Whether the goal will be achieved

Think of it as a **crystal ball for web automation** - test plans, validate sequences, optimize paths.

## Quick Start

### Goal-Based Prediction

```bash
curl -X POST http://212.115.124.137:8000/v1/rollout \
  -H "Authorization: Bearer stratus_sk_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Find and book a hotel in San Francisco",
    "max_steps": 3,
    "return_intermediate": true
  }'
```

### Explicit Action Sequence

```bash
curl -X POST http://212.115.124.137:8000/v1/rollout \
  -H "Authorization: Bearer stratus_sk_test_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Navigate webpage",
    "actions": [17, 10, 28],
    "return_intermediate": true
  }'
```

## API Reference

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `goal` | string | Yes | Natural language description of the goal |
| `max_steps` | integer | No | Maximum steps to plan (default: 5) |
| `actions` | integer[] | No | Explicit action IDs (overrides planning) |
| `return_intermediate` | boolean | No | Include intermediate predictions (default: true) |
| `initial_state` | string | No | Custom initial state description |

### Response Structure

```typescript
interface RolloutResponse {
  id: string;                    // Request ID
  object: "rollout.prediction";
  created: number;               // Unix timestamp
  goal: string;                  // Input goal
  initial_state: string;         // Starting state

  action_sequence: ActionStep[]; // Predicted actions
  predictions?: Prediction[];    // State predictions (if return_intermediate=true)
  summary: Summary;              // Overall analysis
}

interface ActionStep {
  step: number;           // 1-indexed step number
  action_id: number;      // Integer action ID (0-66)
  action_name: string;    // Human-readable name
  action_category: string; // retrieval, navigation, interaction, system
}

interface Prediction {
  step: number;
  action: ActionStep;
  current_state: StateInfo;
  predicted_state: StateInfo;
  state_change: number;          // Magnitude of transition
  interpretation: string;        // Human-readable interpretation
}

interface StateInfo {
  step: number;
  magnitude: number;             // Embedding magnitude (complexity indicator)
  confidence: "High" | "Medium" | "Low";
}

interface Summary {
  total_steps: number;
  initial_magnitude: number;
  final_magnitude: number;
  total_state_change: number;
  outcome: string;              // Goal achievement prediction
  action_path: string[];        // Action names sequence
}
```

## Real Test Results

### Test: Hotel Booking (3 steps)

**Request:**
```json
{
  "goal": "Find and book a hotel in San Francisco",
  "max_steps": 3,
  "return_intermediate": true
}
```

**Response Summary:**
```json
{
  "action_sequence": [
    {"action_name": "search", "category": "retrieval"},
    {"action_name": "select", "category": "navigation"},
    {"action_name": "read", "category": "retrieval"}
  ],
  "summary": {
    "outcome": "Goal likely achieved (large cumulative change)",
    "total_state_change": 23.45,
    "action_path": ["search", "select", "read"]
  }
}
```

**Analysis:**
- ✅ Logical sequence: search → select result → read details
- ✅ High confidence (all states >15 magnitude)
- ✅ Strong transitions (15.48, 11.10, 18.95)
- ⏱️ Response time: ~2.5s

## Interpreting Results

### State Magnitude

Indicates state complexity:
- **< 10**: Low complexity
- **10-15**: Medium complexity
- **15-20**: High complexity (typical web interactions)
- **> 20**: Very high complexity

### State Change

Indicates transition significance:
- **< 5**: Minor transition (small action)
- **5-10**: Moderate transition
- **10-15**: Significant transition (important action)
- **> 15**: Major transition (critical action)

### Outcome Interpretation

Common outcomes:
- `"Goal likely achieved (large cumulative change)"` - Total change >20, strong transitions
- `"Significant progress toward goal"` - Total change 10-20, moderate progress
- `"Minimal progress"` - Total change <10, weak transitions

## Use Cases

### 1. Plan Validation

Test if a multi-step sequence will work:

```python
import requests

def validate_plan(goal, max_steps=5):
    response = requests.post(
        "http://212.115.124.137:8000/v1/rollout",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"goal": goal, "max_steps": max_steps}
    )

    summary = response.json()['summary']
    if summary['outcome'].startswith('Goal likely achieved'):
        return True, summary['action_path']
    return False, None

# Usage
success, actions = validate_plan("Login and download report")
if success:
    print(f"✅ Plan validated: {actions}")
    execute_plan(actions)
else:
    print("⚠️ Plan may fail - revising")
```

### 2. Path Comparison

Find the optimal action sequence:

```python
def compare_paths(goal, path_options):
    results = []
    for actions in path_options:
        resp = requests.post(
            "http://212.115.124.137:8000/v1/rollout",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"goal": goal, "actions": actions}
        )
        results.append({
            'actions': actions,
            'state_change': resp.json()['summary']['total_state_change'],
            'outcome': resp.json()['summary']['outcome']
        })

    best = max(results, key=lambda x: x['state_change'])
    return best

# Usage
paths = [
    [17, 10, 28],  # search → select → read
    [5, 10, 28],   # navigate → select → read
    [17, 28, 10]   # search → read → select
]

best_path = compare_paths("Book hotel", paths)
print(f"Best: {best_path['actions']} (change: {best_path['state_change']})")
```

### 3. Debugging

Compare predicted vs actual execution:

```python
def debug_execution(goal, failed_sequence):
    # Get what Stratus predicted would happen
    prediction = requests.post(
        "http://212.115.124.137:8000/v1/rollout",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"goal": goal, "actions": failed_sequence}
    ).json()

    print(f"Goal: {goal}")
    print(f"Sequence: {prediction['summary']['action_path']}")

    for pred in prediction['predictions']:
        print(f"\nStep {pred['step']}: {pred['action']['action_name']}")
        print(f"  Expected change: {pred['state_change']:.2f}")
        print(f"  Interpretation: {pred['interpretation']}")

    # Compare to actual execution logs
    # Identify divergence point
```

### 4. Goal Achievement Estimation

Find minimum steps needed:

```python
def estimate_steps(goal):
    for steps in [2, 3, 5, 7, 10]:
        resp = requests.post(
            "http://212.115.124.137:8000/v1/rollout",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"goal": goal, "max_steps": steps}
        ).json()

        outcome = resp['summary']['outcome']
        print(f"{steps} steps: {outcome}")

        if "Goal likely achieved" in outcome:
            return steps, resp['summary']['action_path']

    return None, None

# Usage
min_steps, path = estimate_steps("Complete checkout flow")
print(f"✅ Minimum {min_steps} steps: {path}")
```

### 5. What-If Analysis

Test action variations:

```python
def what_if_analysis(goal, base_actions):
    variations = [
        base_actions,                                    # Original
        [5] + base_actions[1:],                         # Different first
        base_actions[:1] + [15] + base_actions[2:],    # Different middle
        base_actions[:-1] + [15]                        # Different last
    ]

    for i, actions in enumerate(variations):
        resp = requests.post(
            "http://212.115.124.137:8000/v1/rollout",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={"goal": goal, "actions": actions}
        ).json()

        print(f"\nVariation {i}: {resp['summary']['action_path']}")
        print(f"  Final magnitude: {resp['summary']['final_magnitude']:.2f}")
        print(f"  Outcome: {resp['summary']['outcome']}")
```

## Performance

| Metric | Value | Notes |
|--------|-------|-------|
| **Latency** | 2-5s | For 3-5 step rollouts |
| **Throughput** | ~0.5 req/s | Single GPU |
| **Max Steps** | 10+ | Latency scales linearly |
| **Model Size** | 290.4M | V3 base checkpoint |
| **GPU Memory** | ~1.7GB | CUDA inference |

## Known Limitations

### 1. No Intermediate States Bug

**Issue:** `return_intermediate: false` causes index error

**Workaround:** Always use `return_intermediate: true`

**Status:** ⚠️ Known bug, needs fix

### 2. No Real Auth

**Issue:** API key validation only checks format (stratus_sk_test_* or stratus_sk_live_*)

**Impact:** Any key with correct prefix works

**Status:** ⚠️ Testing mode only

### 3. Action Catalog

**Issue:** 67 discrete actions (0-66) not fully documented

**Need:** Complete action catalog with descriptions

### 4. State Opacity

**Issue:** State embeddings are 768-dim vectors, not human-readable

**Workaround:** Use magnitude and change as proxies

**Future:** Generative adapter (Phase 3 roadmap)

## Integration Examples

### Python

```python
import requests

class StratusRollout:
    def __init__(self, api_key, base_url="http://212.115.124.137:8000"):
        self.api_key = api_key
        self.base_url = base_url

    def predict(self, goal, max_steps=5, actions=None):
        payload = {
            "goal": goal,
            "max_steps": max_steps,
            "return_intermediate": True
        }
        if actions:
            payload["actions"] = actions

        response = requests.post(
            f"{self.base_url}/v1/rollout",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        return response.json()

# Usage
client = StratusRollout("stratus_sk_test_your_key")
result = client.predict("Find and book a hotel in SF", max_steps=3)

print(f"Predicted: {result['summary']['action_path']}")
print(f"Outcome: {result['summary']['outcome']}")
```

### TypeScript

```typescript
interface RolloutRequest {
  goal: string;
  max_steps?: number;
  actions?: number[];
  return_intermediate?: boolean;
}

class StratusClient {
  constructor(
    private apiKey: string,
    private baseUrl = "http://212.115.124.137:8000"
  ) {}

  async rollout(request: RolloutRequest): Promise<RolloutResponse> {
    const response = await fetch(`${this.baseUrl}/v1/rollout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_intermediate: true,
        max_steps: 5,
        ...request
      })
    });

    return response.json();
  }
}

// Usage
const client = new StratusClient('stratus_sk_test_your_key');
const result = await client.rollout({
  goal: 'Find and book a hotel in SF',
  max_steps: 3
});

console.log(`Predicted: ${result.summary.action_path}`);
console.log(`Outcome: ${result.summary.outcome}`);
```

## Testing

Run the comprehensive test suite:

```bash
python3 /path/to/test-rollout-comprehensive.py
```

Includes:
- Basic functionality (goal-based, explicit actions)
- Edge cases (single step, long sequences)
- Goal variations (e-commerce, forms, navigation)
- State transition validation
- Performance benchmarks

## Comparison to Other Endpoints

| Endpoint | Purpose | LLM Used | Latency | Output |
|----------|---------|----------|---------|---------|
| `/v1/chat/completions` | Reasoning + response | Yes | 5-20s | Text answer |
| `/v1/rollout` | Multi-step prediction | No | 2-5s | Action sequence |
| `/v1/messages` | Anthropic-compatible | Yes | 5-20s | Text answer |

**Unique to Rollout:**
- No LLM invocation (pure Stratus)
- Returns structured predictions
- State transition analysis
- Goal achievement estimation

## Future Enhancements

### Phase 2: Policy Head (Feb-Mar 2026)
- Neural network to rank action sequences
- Better action selection

### Phase 3: Generative Adapter (Mar-Apr 2026)
- Translate embeddings → natural language
- "After clicking, you'll see..."

### Phase 4: Continuous Actions (Apr-May 2026)
- Move from 67 discrete to continuous vectors
- Click coordinates, scroll amounts

## References

**Server:** http://212.115.124.137:8000
**Model:** Stratus V3 Base (checkpoint 164500)
**Code:** `/home/formation/m-jepa-g/api/server.py:510-700`
**Documentation:** [API_SERVER_TECHNICAL_SPEC.md](./API_SERVER_TECHNICAL_SPEC.md)
**Deployed:** January 28, 2026

---

**Last Updated:** January 28, 2026
**Status:** ✅ Production-ready (with known limitations)
