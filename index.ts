// Programmatic MCP tool discovery without an LLM/agent layer.

import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.d.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientInformationMixed, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth";
import { execFile } from "node:child_process";
import { createServer } from "node:http";

const client = new Client({
    name: "mcp-tool-discovery",
    version: "0.0.1",
});


let codeVerifier = '';
let clientInformation: OAuthClientInformationMixed;
let savedTokens: OAuthTokens;

const authProvider: OAuthClientProvider = {
    redirectUrl: 'http://localhost:3000/callback',
    clientMetadata: { redirect_uris: ['http://localhost:3000/callback'] },
    // clientInformation: () => ({ client_id: "mcp-tool-discovery" }),
    clientInformation: () => clientInformation,
    saveClientInformation: (ci) => { console.log('saveClientInformation called:', ci); clientInformation = ci },
    tokens: () => savedTokens,
    saveTokens: (tokens) => { savedTokens = tokens; console.log('OAuth tokens saved') },
    redirectToAuthorization: (authorizationUrl: URL) => { execFile("open", [authorizationUrl.href]); },
    saveCodeVerifier: (cV: string) => { console.log(cV, '******cV'); codeVerifier = cV; },
    codeVerifier: () => { console.log(codeVerifier, '******w'); return codeVerifier; },
}

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.upwork.com/mcp"), {
    authProvider,
});

try {
    const server = createServer(async (req, res) => {
        const url = new URL(req.url!, "http://localhost:3000");
        const code = url.searchParams.get('code');

        if (!code) {
            res.writeHead(400);
            res.end("Missing authorization code");
            return;
        }

        await transport.finishAuth(code);
    });

    server.listen(3000, () => {
        console.log('Server listening on port:3000 🎧');
    });

    await client.connect(transport);
    const tools = await client.listTools();
    console.dir(tools, { depth: null });
} catch (error) {
    console.error(error);
}


