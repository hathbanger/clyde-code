# Rollout Validation Examples

Real-world examples of using `stratus_rollout` for plan validation in Claude Code.

## Example 1: Validate Database Migration

### User Request
```
I need to add a new 'role' column to the users table and backfill existing users with 'member' role. Validate this plan.
```

### Claude Code Workflow

#### Step 1: Use stratus_rollout to predict
```javascript
const validation = await stratus_rollout({
  goal: "Add role column to users table and backfill with default values",
  max_steps: 5
});
```

#### Step 2: Analyze results
```json
{
  "summary": {
    "action_path": ["backup_db", "alter_table", "backfill_data", "verify", "commit"],
    "total_state_change": 19.8,
    "outcome": "Goal likely achieved (large cumulative change)"
  },
  "predictions": [
    {
      "step": 2,
      "action": {"action_name": "alter_table"},
      "state_change": 15.6,
      "interpretation": "Major state transition (critical action)"
    },
    {
      "step": 3,
      "action": {"action_name": "backfill_data"},
      "state_change": 12.3,
      "interpretation": "Significant transition (important action)"
    }
  ]
}
```

#### Step 3: Claude's Response to User
```markdown
⚠️ **Rollout Validation Results**

**Confidence**: 0.82 (High)
**Predicted Outcome**: Goal likely achieved

### Predicted Steps
1. ✅ backup_db (change: 3.2) - Low risk
2. 🚨 alter_table (change: 15.6) - High risk
3. ⚠️ backfill_data (change: 12.3) - Medium risk
4. ✅ verify (change: 4.1) - Low risk
5. ✅ commit (change: 2.8) - Low risk

### Risk Analysis
**High-risk steps**: 2, 3
- Step 2 (alter_table): Major schema change, irreversible
- Step 3 (backfill_data): Touches all rows, performance impact

### Recommendation
⚠️ **Proceed with safeguards**

The plan will likely succeed, but includes two risky operations. Recommended approach:

```sql
-- 1. Backup (automatic in rollout prediction)
pg_dump mydb > backup.sql

-- 2. Add column (nullable first, for safety)
ALTER TABLE users ADD COLUMN role VARCHAR(50);

-- 3. Backfill in batches (not all at once)
UPDATE users SET role = 'member' WHERE role IS NULL LIMIT 1000;
-- Repeat until all updated

-- 4. Verify
SELECT COUNT(*) FROM users WHERE role IS NULL;

-- 5. Add NOT NULL constraint (once verified)
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
```

**Would you like me to:**
1. ✅ Execute with these safeguards
2. ⚠️ Test on staging environment first
3. 📝 Generate rollback script

[1/2/3]
```

---

## Example 2: Compare Refactoring Approaches

### User Request
```
Should I refactor incrementally or do a big bang rewrite of the auth module?
```

### Claude Code Workflow

#### Step 1: Test both approaches
```javascript
// Approach A: Incremental
const incrementalResult = await stratus_rollout({
  goal: "Incrementally refactor auth module with backward compatibility",
  max_steps: 7
});

// Approach B: Big bang
const bigBangResult = await stratus_rollout({
  goal: "Complete rewrite of auth module",
  max_steps: 3
});
```

#### Step 2: Compare results
```javascript
const comparison = {
  incremental: {
    confidence: 0.89,
    total_change: 14.2,
    steps: incrementalResult.summary.action_path
  },
  bigBang: {
    confidence: 0.58,
    total_change: 28.7,
    steps: bigBangResult.summary.action_path
  }
};
```

#### Step 3: Claude's Response
```markdown
## Refactoring Approach Comparison

### Option A: Incremental Refactoring
**Confidence**: 0.89 (High) ✅
**Total State Change**: 14.2 (Medium)
**Steps**: 7

```
1. extract_auth_logic → 2. add_compatibility_layer → 3. migrate_endpoints_1 →
4. migrate_endpoints_2 → 5. migrate_endpoints_3 → 6. remove_old_code →
7. cleanup
```

**Pros:**
- High confidence (0.89)
- Lower risk (medium state change)
- Gradual migration (can pause/rollback)
- Production stays stable throughout

**Cons:**
- More steps (7 vs 3)
- Takes longer
- Temporary complexity (old + new code coexist)

---

### Option B: Big Bang Rewrite
**Confidence**: 0.58 (Medium-Low) ⚠️
**Total State Change**: 28.7 (Very High)
**Steps**: 3

```
1. remove_old_auth → 2. implement_new_auth → 3. migrate_all
```

**Pros:**
- Fewer steps (3 vs 7)
- Clean slate
- Modern patterns from start

**Cons:**
- Lower confidence (0.58)
- Very high risk (28.7 state change)
- All-or-nothing (hard to rollback)
- Production disruption likely

---

### Recommendation
✅ **Use Incremental Refactoring (Option A)**

**Reasons:**
1. Higher confidence (0.89 vs 0.58)
2. Lower total risk (14.2 vs 28.7)
3. Production-safe (gradual cutover)
4. Easier rollback if issues arise

**Only use big bang if:**
- Auth module is very small
- You have comprehensive test coverage
- Can afford production downtime
- Current code is beyond repair

**Proceed with incremental refactoring?** [Y/n]
```

---

## Example 3: Detect Missing Steps

### User Request
```
Validate this deployment: npm run build && docker build && docker push
```

### Claude Code Workflow

#### Step 1: Rollout validation
```javascript
const validation = await stratus_rollout({
  goal: "Build application, create Docker image, and push to registry",
  max_steps: 5
});
```

#### Step 2: Analyze predicted vs expected
```javascript
const expected = ['build', 'docker_build', 'docker_push'];
const predicted = validation.summary.action_path;
// predicted: ['build', 'test', 'docker_build', 'tag', 'docker_push']

const missing = predicted.filter(a => !expected.includes(a));
// missing: ['test', 'tag']
```

#### Step 3: Claude's Response
```markdown
⚠️ **Missing Steps Detected**

Your sequence: `build → docker_build → docker_push`

Rollout predicts: `build → **test** → docker_build → **tag** → docker_push`

### Missing Steps

1. **test** (after build, before Docker)
   - State change: 6.8 (moderate)
   - **Why important**: Catch bugs before containerization
   - **Recommendation**: Add `npm test`

2. **tag** (after docker_build, before push)
   - State change: 3.2 (minor)
   - **Why important**: Version tracking, rollback capability
   - **Recommendation**: Add `docker tag myapp:latest myapp:v1.2.3`

### Recommended Sequence

```bash
# 1. Build
npm run build

# 2. Test (MISSING - rollout suggests adding)
npm test

# 3. Build Docker image
docker build -t myapp:latest .

# 4. Tag (MISSING - rollout suggests adding)
docker tag myapp:latest myapp:$(git rev-parse --short HEAD)

# 5. Push
docker push myapp:latest
docker push myapp:$(git rev-parse --short HEAD)
```

**Would you like me to execute the recommended sequence?** [Y/n]
```

---

## Example 4: Interactive Plan Refinement

### User Request
```
Plan a migration from REST API to GraphQL
```

### Claude Code Workflow

#### Step 1: Create initial plan with stratus_plan
```javascript
const plan = await stratus_plan({
  current_state: "Express REST API with 20+ endpoints",
  goal: "GraphQL API with all existing functionality"
});
```

#### Step 2: Validate with stratus_rollout
```javascript
const validation = await stratus_rollout({
  goal: "Migrate from REST to GraphQL",
  max_steps: plan.steps.length
});
```

#### Step 3: Check confidence
```javascript
if (validation.summary.total_state_change > 25) {
  // Very high risk - ask user to break down
}
```

#### Step 4: Claude's Interactive Response
```markdown
## Migration Plan: REST → GraphQL

### Initial Plan (stratus_plan)
1. Install GraphQL dependencies
2. Create GraphQL schema
3. Implement resolvers
4. Add GraphQL endpoint
5. Migrate clients
6. Remove REST endpoints

### Validation Results (stratus_rollout)
**Confidence**: 0.62 (Medium-Low) ⚠️
**Total State Change**: 31.5 (Very High Risk) 🚨
**Outcome**: Significant progress, but high risk

### Risk Analysis
Step 5 (migrate clients) shows **very high** state change (19.8).
This suggests migrating all clients at once is risky.

### Refined Approach (Lower Risk)

**🤔 I can reduce risk by breaking Step 5 into smaller pieces.**

**Option A: Parallel Running** (Recommended)
1. Install GraphQL
2. Create schema + resolvers
3. Add GraphQL endpoint
4. **Run both REST + GraphQL (temporary)**
5. Migrate Client A
6. Migrate Client B
7. Migrate Client C
8. Remove REST endpoints

**Option B: Feature Flags**
1. Install GraphQL
2. Create schema + resolvers
3. Add GraphQL endpoint with feature flag
4. Enable for 10% of users
5. Enable for 50% of users
6. Enable for 100% of users
7. Remove REST endpoints

**Which approach would you prefer?**
[A] Parallel running (gradual, safer)
[B] Feature flags (controlled rollout)
[C] Proceed with original plan (riskier, faster)

[A/B/C]
```

---

## Integration Patterns

### Pattern 1: Automatic Validation (Hook)
```javascript
// In validate-plan-with-rollout.md hook

if (isMultiStepPlan && stepsCount >= 3) {
  const validation = await stratus_rollout({
    goal: extractGoal(userRequest),
    max_steps: stepsCount
  });

  if (validation.summary.total_state_change > 20) {
    warnUser('High-risk operation detected');
  }
}
```

### Pattern 2: Compare Alternatives (Agent)
```javascript
// In plan-validator agent

const alternatives = [
  { approach: "A", goal: "..." },
  { approach: "B", goal: "..." },
  { approach: "C", goal: "..." }
];

const results = await Promise.all(
  alternatives.map(alt => stratus_rollout({ goal: alt.goal, max_steps: 5 }))
);

const best = results.reduce((best, curr) =>
  curr.summary.total_state_change < best.summary.total_state_change ? curr : best
);

presentComparison(results, best);
```

### Pattern 3: Iterative Refinement
```javascript
let plan = await stratus_plan({ current_state, goal });
let validation = await stratus_rollout({ goal, max_steps: plan.steps.length });

while (validation.summary.total_state_change > riskThreshold) {
  // Break down high-risk steps
  plan = await refineHighRiskSteps(plan, validation);
  validation = await stratus_rollout({ goal, max_steps: plan.steps.length });
}

return plan; // Now validated and safe
```

---

## Best Practices

### 1. Always Interpret Results
Don't just show raw numbers - explain what they mean:
```markdown
❌ "Total state change: 18.5"
✅ "Total state change: 18.5 (high-impact, similar to database migration)"
```

### 2. Provide Alternatives
If confidence is low, suggest alternatives:
```markdown
⚠️ Confidence is only 0.55. Consider:
- Breaking into smaller steps
- Adding intermediate verification
- Testing on staging first
```

### 3. Map Predictions to Code
Show concrete actions, not abstract predictions:
```markdown
Predicted: backup_db → alter_table → verify

Actual commands:
```bash
pg_dump mydb > backup.sql
psql mydb -c "ALTER TABLE users ADD COLUMN role VARCHAR(50);"
psql mydb -c "SELECT COUNT(*) FROM users WHERE role IS NULL;"
```
```

### 4. Use State Change Thresholds
- < 10: Low risk, proceed
- 10-20: Medium risk, warn
- 20+: High risk, require confirmation

---

**For complete API reference, see:** [ROLLOUT_ENDPOINT_GUIDE.md](../docs/ROLLOUT_ENDPOINT_GUIDE.md)
