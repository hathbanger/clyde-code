# Stratus X1 Documentation

Complete documentation for the Stratus X1 reasoning plugin for Claude Code.

## Quick Links

- [Main README](../README.md) - Installation and quick start
- [Authentication Guide](../AUTH_INTEGRATION.md) - Setting up your API key
- [Status & Roadmap](../STATUS.md) - Current status and future plans

## API Documentation

### Rollout Endpoint
- **[ROLLOUT_ENDPOINT_GUIDE.md](./ROLLOUT_ENDPOINT_GUIDE.md)** - Complete guide to the `/v1/rollout` endpoint for multi-step action prediction

## Architecture

### MCP Tools (6 total)

| Tool | Endpoint | Type | Latency | Use Case |
|------|----------|------|---------|----------|
| `stratus_count` | `/v1/chat/completions` | LLM | 5-20s | Accurate counting |
| `stratus_verify` | `/v1/chat/completions` | LLM | 5-20s | Math verification |
| `stratus_analyze` | `/v1/chat/completions` | LLM | 5-20s | Pattern analysis |
| `stratus_compress` | `/v1/chat/completions` | LLM | 5-20s | Long-context compression |
| `stratus_plan` | `/v1/chat/completions` | LLM | 5-20s | Multi-step planning |
| `stratus_rollout` | `/v1/rollout` | T-JEPA | 2-5s | Action sequence validation |

### Hooks

- **validate-plan-with-rollout** - Automatically validates multi-step plans before execution using rollout endpoint

### Agents

- **plan-validator** - Specialized agent for validating and comparing execution plans

## Integration Patterns

### Two-Stage Planning
Combine LLM planning with T-JEPA validation:

```javascript
// 1. Create plan (creative, uses LLM)
const plan = await stratus_plan({
  current_state: "Current architecture",
  goal: "Desired outcome"
});

// 2. Validate plan (fast, uses pure T-JEPA)
const validation = await stratus_rollout({
  goal: plan.goal,
  max_steps: plan.steps.length
});

// 3. Compare & decide
if (validation.summary.outcome.includes("likely achieved")) {
  execute(plan);
} else {
  revise(plan);
}
```

### Path Comparison
Test multiple approaches to find the best:

```javascript
const approaches = [
  { goal: "Approach A: Big bang migration", max_steps: 3 },
  { goal: "Approach B: Gradual migration", max_steps: 7 },
  { goal: "Approach C: Adapter pattern", max_steps: 5 }
];

const results = await Promise.all(
  approaches.map(a => stratus_rollout(a))
);

const best = results.sort((a, b) =>
  b.summary.total_state_change - a.summary.total_state_change
)[0];
```

### Pre-Execution Validation
Safety check before destructive operations:

```javascript
async function safeExecute(goal, operation) {
  const validation = await stratus_rollout({ goal, max_steps: 5 });

  if (validation.summary.total_state_change > 20) {
    console.warn('⚠️ High-risk operation detected');
    const confirm = await askUser('Proceed?');
    if (!confirm) return;
  }

  operation();
}
```

## Use Cases

### For Claude Code

1. **Plan Validation** - Validate multi-step refactoring before execution
2. **Risk Detection** - Identify risky operations (high state change)
3. **Path Optimization** - Compare alternative approaches
4. **Missing Step Detection** - Find gaps in execution plans
5. **Confidence Scoring** - Provide probability of success

### For Developers

1. **Pre-commit Checks** - Validate complex git operations
2. **Deployment Safety** - Test deployment sequences
3. **Refactoring Confidence** - Check if refactoring will work
4. **Learning Tool** - Understand optimal action sequences

## Model Information

- **Server**: http://212.115.124.137:8000
- **Model**: Stratus V3 Base (checkpoint 164500)
- **Parameters**: 290.4M
- **Architecture**: T-JEPA (Joint Embedding Predictive Architecture)
- **Action Space**: 67 discrete actions (0-66)
- **State Space**: 768-dim embeddings

## Performance

| Metric | Value |
|--------|-------|
| Rollout Latency | 2-5s (for 3-5 steps) |
| LLM Latency | 5-20s |
| Throughput | ~0.5 req/s |
| GPU Memory | ~1.7GB |

## Roadmap

### Phase 2: Policy Head (Feb-Mar 2026)
- Neural network for action ranking
- Better action selection

### Phase 3: Generative Adapter (Mar-Apr 2026)
- Translate embeddings → natural language
- Human-readable state descriptions

### Phase 4: Continuous Actions (Apr-May 2026)
- Move from 67 discrete → continuous vectors
- Click coordinates, scroll amounts

## Troubleshooting

See [Main README - Troubleshooting](../README.md#troubleshooting) for:
- Authentication issues
- API connection problems
- Tool not showing up

## Contributing

To add new capabilities:

1. **New Tool**: Add to `mcp-server/src/tools/`
2. **New Hook**: Add to `hooks/`
3. **New Agent**: Add to `agents/`
4. **Update Server**: Register in `stratus-server.ts`
5. **Rebuild**: `npm run build`

## Support

- **Email**: team@formation.cloud
- **Documentation**: This directory
- **Issues**: Report bugs via email

---

**Built by Formation** | [formation.cloud](https://formation.cloud)
