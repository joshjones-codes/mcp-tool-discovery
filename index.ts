// Programmatic MCP tool discovery without an LLM/agent layer.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({
    name: "mcp-tool-discovery",
    version: "0.0.1",
});

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.upwork.com/mcp"));

await client.connect(transport);

const tools = await client.listTools();

console.dir(tools, { depth: null });