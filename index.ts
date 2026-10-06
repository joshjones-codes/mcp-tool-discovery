// Programmatic MCP tool discovery without an LLM/agent layer.

import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.d.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientInformationMixed, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { loadJSON, saveJSON } from "./storage.ts";
import type { Tool } from "@modelcontextprotocol/sdk/types";

const MCP_URL = "https://mcp.upwork.com/mcp";
const REDIRECT_URL = "http://localhost:3000/callback";

const logTools = (tools: Tool[]) => {
    console.log(`Discovered ${tools.length} tools:`);
    tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
    });
}

const authProvider: OAuthClientProvider = {
    redirectUrl: REDIRECT_URL,
    clientMetadata: { redirect_uris: [REDIRECT_URL] },
    clientInformation: async () => {
        const info = await loadJSON<OAuthClientInformationMixed>("client.json");
        if (
            !info ||
            typeof info !== "object" ||
            typeof info.client_id !== "string"
        ) {
            return undefined;
        }

        return info;
    },
    saveClientInformation: (ci) => { saveJSON('client.json', ci); console.log('Client information saved ✅'); },
    tokens: async () => {
        const tokens = await loadJSON<OAuthTokens>('tokens.json');
        if (!tokens ||
            typeof tokens !== "object" ||
            typeof tokens.access_token !== "string"
        )
            return undefined;
        return tokens;
    },
    saveTokens: (tokens) => { saveJSON('tokens.json', tokens); console.log('OAuth tokens saved ✅'); },
    redirectToAuthorization: (authorizationUrl: URL) => { execFile("open", [authorizationUrl.href]); },
    saveCodeVerifier: (cv: string) => { saveJSON('verifier.json', cv); console.log('Code verifier saved ✅'); },
    codeVerifier: async () => {
        const verifier = await loadJSON('verifier.json');
        if (typeof verifier !== 'string')
            return '';
        return verifier;
    }
};

// Factories
const createClient = () =>
    new Client({
        name: "mcp-tool-discovery",
        version: "0.0.1",
    });

const createTransport = () =>
    new StreamableHTTPClientTransport(new URL(MCP_URL), {
        authProvider,
    });


const initialClient = createClient();
const initialTransport = createTransport();

// server
const server = createServer(async (req, res) => {
    const url = new URL(req.url!, REDIRECT_URL);

    if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
    }

    const code = url.searchParams.get('code');

    if (!code) {
        res.writeHead(400);
        res.end("Missing authorization code");
        return;
    }

    try {
        // 1. Exchange authorization code for tokens
        await initialTransport.finishAuth(code);

        const authenticatedClient = createClient();
        const authenticateTransport = createTransport();

        // 2. Reconnect with the authenticated transport
        await authenticatedClient.connect(authenticateTransport);

        // 3. Discover available MCP tools
        const { tools } = await authenticatedClient.listTools();
        logTools(tools);

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Authorization successful! Check your terminal.");
    } catch (error) {
        console.error("OAuth callback failed:", error);
        res.writeHead(500);
        res.end("Authentication failed");
    }
});

server.listen(3000, () => {
    console.log('Server listening on port:3000 🎧');
});

try {
    await initialClient.connect(initialTransport);
    const { tools } = await initialClient.listTools();
    logTools(tools);
} catch (error) {
    console.error('Initial connection error:', error);
}
