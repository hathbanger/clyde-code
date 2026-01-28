#!/bin/bash
# Test Stratus Rollout Integration
# This script tests the new stratus_rollout tool

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Testing Stratus Rollout Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check build
echo "1️⃣  Checking build..."
cd plugins/stratus-reasoning/mcp-server
if [ ! -d "dist" ]; then
  echo "❌ Not built. Running npm run build..."
  npm run build
else
  echo "✅ Build directory exists"
fi
echo ""

# 2. Check rollout tool exists
echo "2️⃣  Checking rollout tool..."
if [ -f "dist/src/tools/rollout.js" ]; then
  echo "✅ rollout.js compiled"
else
  echo "❌ rollout.js not found"
  exit 1
fi
echo ""

# 3. Check types
echo "3️⃣  Checking types..."
if grep -q "RolloutRequest" dist/src/types.d.ts 2>/dev/null; then
  echo "✅ Rollout types compiled"
else
  echo "❌ Rollout types not found"
  exit 1
fi
echo ""

# 4. Check server registration
echo "4️⃣  Checking server registration..."
if grep -q "stratus_rollout" dist/stratus-server.js; then
  echo "✅ Rollout tool registered in server"
else
  echo "❌ Rollout tool not registered"
  exit 1
fi
echo ""

# 5. Check hooks
echo "5️⃣  Checking hooks..."
cd ..
if [ -f "hooks/validate-plan-with-rollout.md" ]; then
  echo "✅ validate-plan-with-rollout hook exists"
else
  echo "❌ Hook not found"
  exit 1
fi
echo ""

# 6. Check agent
echo "6️⃣  Checking agent..."
if [ -f "agents/plan-validator.md" ]; then
  echo "✅ plan-validator agent exists"
else
  echo "❌ Agent not found"
  exit 1
fi
echo ""

# 7. Check documentation
echo "7️⃣  Checking documentation..."
if [ -f "docs/ROLLOUT_ENDPOINT_GUIDE.md" ]; then
  echo "✅ ROLLOUT_ENDPOINT_GUIDE.md exists"
else
  echo "❌ Documentation not found"
  exit 1
fi
echo ""

# 8. Check examples
echo "8️⃣  Checking examples..."
if [ -f "examples/rollout-validation-example.md" ]; then
  echo "✅ Examples exist"
else
  echo "❌ Examples not found"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ All Integration Tests Passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Rollout integration is ready!"
echo ""
echo "Next steps:"
echo "  1. Test in Clyde: clyde"
echo "  2. Try: Use stratus_rollout to validate migrating from Redux to Zustand"
echo "  3. Check logs for tool registration"
echo ""
echo "📚 Documentation:"
echo "  - Guide: plugins/stratus-reasoning/docs/ROLLOUT_ENDPOINT_GUIDE.md"
echo "  - Examples: plugins/stratus-reasoning/examples/rollout-validation-example.md"
echo "  - Hook: plugins/stratus-reasoning/hooks/validate-plan-with-rollout.md"
echo "  - Agent: plugins/stratus-reasoning/agents/plan-validator.md"
echo ""
