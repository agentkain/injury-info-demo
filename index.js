#!/usr/bin/env node

/**
 * Model Context Protocol (MCP) Server Implementation
 * This server provides tools for file operations, system information, and basic utilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class McpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'example-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read the contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file to read',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the file to write',
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the file',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory to list',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'system_info',
            description: 'Get system information',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'calculate',
            description: 'Perform basic mathematical calculations',
            inputSchema: {
              type: 'object',
              properties: {
                expression: {
                  type: 'string',
                  description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
                },
              },
              required: ['expression'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.handleReadFile(args.path);

          case 'write_file':
            return await this.handleWriteFile(args.path, args.content);

          case 'list_directory':
            return await this.handleListDirectory(args.path);

          case 'system_info':
            return await this.handleSystemInfo();

          case 'calculate':
            return await this.handleCalculate(args.expression);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  async handleReadFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `File: ${filePath}\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${error.message}`
      );
    }
  }

  async handleWriteFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote to file: ${filePath}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to write file: ${error.message}`
      );
    }
  }

  async handleListDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const formatted = entries
        .map((entry) => {
          const type = entry.isDirectory() ? '[DIR]' : '[FILE]';
          return `${type} ${entry.name}`;
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Directory: ${dirPath}\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list directory: ${error.message}`
      );
    }
  }

  async handleSystemInfo() {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      nodeVersion: process.version,
    };

    const formatted = Object.entries(info)
      .map(([key, value]) => {
        if (key === 'uptime') {
          const hours = Math.floor(value / 3600);
          const minutes = Math.floor((value % 3600) / 60);
          return `${key}: ${hours}h ${minutes}m`;
        }
        if (key.includes('Memory')) {
          return `${key}: ${Math.round(value / 1024 / 1024 / 1024 * 100) / 100} GB`;
        }
        return `${key}: ${value}`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `System Information:\n\n${formatted}`,
        },
      ],
    };
  }

  async handleCalculate(expression) {
    try {
      // Basic security: only allow numbers, operators, parentheses, and spaces
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }

      // eslint-disable-next-line no-eval
      const result = eval(expression);
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }

      return {
        content: [
          {
            type: 'text',
            text: `${expression} = ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Calculation failed: ${error.message}`
      );
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Server running on stdio');
  }
}

// Start the server
const server = new McpServer();
server.run().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 