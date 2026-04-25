import { All, Controller, HttpStatus, Logger, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Private } from 'src/auth/auth.decorator';
import { McpService } from './mcp.service';

@ApiExcludeController()
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Private()
  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    const userId = (req as Request & { user?: { id?: string } }).user?.id;

    if (!userId) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Unauthorized' },
        id: null,
      });
      return;
    }

    if (req.method === 'GET' || req.method === 'DELETE') {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed (stateless server, use POST).',
        },
        id: null,
      });
      return;
    }

    const server = this.mcpService.buildServer(userId);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      this.logger.error(`MCP request failed: ${(e as Error).message}`);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  }
}
