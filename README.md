# MCP Tool Discovery

A small project to explore the Model Context Protocol (MCP), starting with programmatic tool discovery against Upwork's remote MCP server.

The idea is simple: connect to an MCP server, authenticate, and discover what tools are available, without introducing an LLM or agent layer.

This is part of a larger exploration into agentic systems, tool integrations, and the infrastructure behind them.

## What it does

- Connects to Upwork's remote MCP server using the official TypeScript SDK.
- Implements OAuth authentication with PKCE and a local callback server.
- Discovers available tools using `client.listTools()`.
- Persists OAuth client registration, tokens, and PKCE verifier locally as JSON.
- Reuses saved authentication state across application restarts.

## Technical decisions

### Client and transport lifecycle

One interesting issue I ran into was reconnecting after completing the OAuth flow.

Initially, I tried reusing the same client and transport after calling `transport.finishAuth()`. This didn't work.

After digging through the MCP SDK source, I found that `Client.connect()` delegates to `Protocol.connect()`, which calls `transport.start()`.

The transport had already been started during the initial connection attempt, so attempting to reuse it wasn't the right approach.

I introduced simple factories to create fresh client and transport instances for the authenticated connection.

### Persisting OAuth state

Initially, I was keeping OAuth state in memory, including a hardcoded client registration.

That wasn't particularly useful across application restarts.

I added a small JSON storage utility to persist the client registration, access tokens, and PKCE code verifier. The OAuth provider can now load that state from disk rather than relying on hardcoded values.

For now, JSON is sufficient. The goal is to understand the authentication flow before introducing more infrastructure.

## Running locally

Requires Node.js 24+.

```bash
npm install
node index.ts
```

The application starts a local callback server on port `3000` and attempts to connect to Upwork's MCP endpoint.

If authorization is required, it opens the browser to complete the OAuth flow.

Once authenticated, it lists the available MCP tools in the terminal.

Authentication state is stored locally in JSON files and excluded from version control.

## What's next?

Tool discovery is just the starting point.

The longer-term goal is to explore tool execution, orchestration, and eventually building agents that can interact with external services.

For now, I'm deliberately keeping things small and building up from the underlying protocols and SDKs.
