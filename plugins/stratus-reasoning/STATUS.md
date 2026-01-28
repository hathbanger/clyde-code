# Stratus MCP Server Status

## Quick Health Check

Run this to verify Stratus is configured and working:

```bash
cd plugins/stratus-reasoning/mcp-server
npm run status
```

Expected output:
```
🔍 Stratus X1 Health Check

1. Checking configuration...
   ✓ Config loaded from environment/file
   ✓ API URL: http://212.115.124.137:8000
   ✓ API Key: stratus_sk_live_...

2. Testing API connectivity...
   ✓ API is reachable (1500ms)

✅ Stratus X1 is ready to use!
```

## Troubleshooting

### MCP Server Not Loading

If Clyde isn't loading the MCP server:

1. **Check plugin is installed:**
   ```bash
   ls -la plugins/stratus-reasoning/
   ```

2. **Check compiled server exists:**
   ```bash
   ls -la plugins/stratus-reasoning/mcp-server/dist/stratus-server.js
   ```

3. **Check configuration:**
   ```bash
   cat ~/.clyde/stratus-config.json
   ```

4. **Rebuild the server:**
   ```bash
   cd plugins/stratus-reasoning/mcp-server
   npm run build
   ```

### API Connection Issues

If health check fails:

1. **Check API URL is reachable:**
   ```bash
   curl http://212.115.124.137:8000/
   ```

2. **Verify API key is valid:**
   ```bash
   cat ~/.clyde/stratus-config.json | grep apiKey
   ```

3. **Test API directly:**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        -H "Content-Type: application/json" \
        -X POST http://212.115.124.137:8000/v1/chat/completions \
        -d '{"model":"stratus-x1ac-xl-gpt-4o","messages":[{"role":"user","content":"test"}]}'
   ```

### Configuration Issues

Run the setup wizard to reconfigure:

```bash
cd plugins/stratus-reasoning/mcp-server
npm run setup
```

## Server Startup Logs

When Clyde starts, the MCP server logs to stderr. Look for:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stratus X1 MCP Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API URL: http://212.115.124.137:8000
  API Key: stratus_sk_live_...

  Verifying connection...
  ✓ API connected (1500ms)

  Registered tools:
    • stratus_count     - Accurate counting
    • stratus_verify    - Mathematical verification
    • stratus_analyze   - Pattern analysis
    • stratus_compress  - Long-context compression
    • stratus_plan      - Multi-step planning

  ✓ Server ready and listening
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If you see `❌ Stratus API health check failed`, the tools may not work correctly.

## Status Summary

- **Configuration file:** `~/.clyde/stratus-config.json`
- **MCP server:** `plugins/stratus-reasoning/mcp-server/dist/stratus-server.js`
- **MCP config:** `plugins/stratus-reasoning/.mcp.json`
- **Health check:** `npm run status` or `npm run health`
- **API endpoint:** `http://212.115.124.137:8000`

## Manual Server Test

To manually start the MCP server and see logs:

```bash
cd plugins/stratus-reasoning/mcp-server
npm start
```

The server will wait for stdio input (MCP protocol). Press Ctrl+C to exit.
