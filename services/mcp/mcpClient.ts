/**
 * MCP (Model Context Protocol) Client
 *
 * Connects to MCP servers to access real tools, APIs, and data sources
 * Supports: stdio, SSE (Server-Sent Events), and WebSocket transports
 */

export interface MCPServer {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse' | 'websocket';
  url?: string; // For SSE/WebSocket
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * MCP Client for browser environment
 * Uses WebSocket or SSE for remote servers
 */
export class MCPClient {
  private servers: Map<string, MCPServer> = new Map();
  private connections: Map<string, WebSocket | EventSource> = new Map();

  /**
   * Add an MCP server configuration
   */
  addServer(server: MCPServer): void {
    this.servers.set(server.id, server);
    console.log(`[MCP] Added server: ${server.name}`);
  }

  /**
   * Connect to an MCP server
   */
  async connect(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.status === 'connected') {
      console.log(`[MCP] Already connected to ${server.name}`);
      return;
    }

    server.status = 'connecting';
    this.servers.set(serverId, server);

    try {
      if (server.transport === 'websocket' && server.url) {
        await this.connectWebSocket(server);
      } else if (server.transport === 'sse' && server.url) {
        await this.connectSSE(server);
      } else {
        throw new Error('stdio transport not supported in browser');
      }

      server.status = 'connected';
      this.servers.set(serverId, server);

      console.log(`[MCP] Connected to ${server.name}`);
    } catch (error) {
      server.status = 'error';
      this.servers.set(serverId, server);
      console.error(`[MCP] Failed to connect to ${server.name}:`, error);
      throw error;
    }
  }

  /**
   * Connect via WebSocket
   */
  private async connectWebSocket(server: MCPServer): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(server.url!);

      ws.onopen = async () => {
        console.log(`[MCP] WebSocket opened: ${server.name}`);

        // Initialize MCP protocol
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {}
            },
            clientInfo: {
              name: 'AURA Automate',
              version: '1.0.0'
            }
          },
          id: 1
        }));

        // Request available tools
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.result && message.result.tools) {
            server.tools = message.result.tools;
            this.servers.set(server.id, server);
            resolve();
          }
        } catch (error) {
          console.error('[MCP] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`[MCP] WebSocket error: ${server.name}`, error);
        reject(error);
      };

      ws.onclose = () => {
        console.log(`[MCP] WebSocket closed: ${server.name}`);
        server.status = 'disconnected';
        this.servers.set(server.id, server);
        this.connections.delete(server.id);
      };

      this.connections.set(server.id, ws);
    });
  }

  /**
   * Connect via Server-Sent Events
   */
  private async connectSSE(server: MCPServer): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(server.url!);

      eventSource.onopen = () => {
        console.log(`[MCP] SSE connected: ${server.name}`);
        resolve();
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.result && message.result.tools) {
            server.tools = message.result.tools;
            this.servers.set(server.id, server);
          }
        } catch (error) {
          console.error('[MCP] Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[MCP] SSE error: ${server.name}`, error);
        eventSource.close();
        reject(error);
      };

      this.connections.set(server.id, eventSource);
    });
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverId: string, toolCall: MCPToolCall): Promise<MCPToolResult> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.status !== 'connected') {
      throw new Error(`Server ${server.name} is not connected`);
    }

    const connection = this.connections.get(serverId);
    if (!connection) {
      throw new Error(`No connection for server ${serverId}`);
    }

    console.log(`[MCP] Calling tool ${toolCall.name} on ${server.name}`);

    if (connection instanceof WebSocket) {
      return this.callToolWebSocket(connection, toolCall);
    } else {
      throw new Error('Tool calls via SSE not yet implemented');
    }
  }

  /**
   * Call tool via WebSocket
   */
  private async callToolWebSocket(
    ws: WebSocket,
    toolCall: MCPToolCall
  ): Promise<MCPToolResult> {
    return new Promise((resolve, reject) => {
      const requestId = Date.now();

      const timeout = setTimeout(() => {
        reject(new Error('Tool call timeout'));
      }, 30000); // 30 second timeout

      const handler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);

          if (message.id === requestId) {
            clearTimeout(timeout);
            ws.removeEventListener('message', handler);

            if (message.error) {
              reject(new Error(message.error.message));
            } else {
              resolve(message.result as MCPToolResult);
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          ws.removeEventListener('message', handler);
          reject(error);
        }
      };

      ws.addEventListener('message', handler);

      // Send tool call request
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolCall.name,
          arguments: toolCall.arguments
        },
        id: requestId
      }));
    });
  }

  /**
   * Get all available tools across all connected servers
   */
  getAllTools(): Array<MCPTool & { serverId: string; serverName: string }> {
    const tools: Array<MCPTool & { serverId: string; serverName: string }> = [];

    for (const [serverId, server] of this.servers.entries()) {
      if (server.status === 'connected') {
        for (const tool of server.tools) {
          tools.push({
            ...tool,
            serverId,
            serverName: server.name
          });
        }
      }
    }

    return tools;
  }

  /**
   * Get all connected servers
   */
  getConnectedServers(): MCPServer[] {
    return Array.from(this.servers.values()).filter(
      s => s.status === 'connected'
    );
  }

  /**
   * Disconnect from a server
   */
  disconnect(serverId: string): void {
    const connection = this.connections.get(serverId);
    if (connection) {
      if (connection instanceof WebSocket) {
        connection.close();
      } else {
        connection.close();
      }
      this.connections.delete(serverId);
    }

    const server = this.servers.get(serverId);
    if (server) {
      server.status = 'disconnected';
      this.servers.set(serverId, server);
    }
  }

  /**
   * Disconnect from all servers
   */
  disconnectAll(): void {
    for (const serverId of this.connections.keys()) {
      this.disconnect(serverId);
    }
  }
}

// Singleton instance
export const mcpClient = new MCPClient();

/**
 * Pre-configured MCP servers for common integrations
 */
export const BUILTIN_MCP_SERVERS: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'File System',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    transport: 'stdio',
    status: 'disconnected',
    tools: [],
    resources: []
  },
  {
    id: 'github',
    name: 'GitHub',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: ''
    },
    transport: 'stdio',
    status: 'disconnected',
    tools: [],
    resources: []
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gdrive'],
    transport: 'stdio',
    status: 'disconnected',
    tools: [],
    resources: []
  },
  {
    id: 'slack',
    name: 'Slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: '',
      SLACK_TEAM_ID: ''
    },
    transport: 'stdio',
    status: 'disconnected',
    tools: [],
    resources: []
  }
];
