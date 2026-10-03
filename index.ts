// Programmatic MCP tool discovery without an LLM/agent layer.

import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.d.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { execFile } from "node:child_process";
import { createServer } from "node:http";

const client = new Client({
    name: "mcp-tool-discovery",
    version: "0.0.1",
});

const authProvider: OAuthClientProvider = {
    redirectUrl: 'http://localhost:3000',
    clientMetadata: { redirect_uris: [''] },
    clientInformation: () => ({ client_id: "mcp-tool-discovery" }),
    tokens: () => ({ access_token: '', token_type: '' }),
    saveTokens: (tokens) => { console.log('We need to save tokens! 🪙', tokens) },
    redirectToAuthorization: (authorizationUrl: URL) => { execFile("open", [authorizationUrl.href]); },
    saveCodeVerifier: (codeVerifier: string) => { console.log('[saveCodeVerifier]: codeVerifier:', codeVerifier) },
    codeVerifier: () => { console.log('codeVerifier called'); return '' },
}

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.upwork.com/mcp"), {
    authProvider,
});

try {
    const server = createServer();
    server.listen(3000, () => {
        console.log('Server listening on port:3000 🎧');
    });

    await client.connect(transport);
    const tools = await client.listTools();
    console.dir(tools, { depth: null });
} catch (error) {
    console.error(error);
}


