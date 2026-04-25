import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PlaceService } from 'src/place/place.service';
import { SavedPlaceService } from 'src/saved/saved.service';
import { TagService } from 'src/tag/tag.service';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly placeService: PlaceService,
    private readonly savedPlaceService: SavedPlaceService,
    private readonly tagService: TagService,
  ) {}

  buildServer(userId: string): McpServer {
    const server = new McpServer(
      { name: 'pin-my-map', version: '1.0.0' },
      {
        instructions:
          "Pin My Map MCP server. Use these tools to search, read, create and save places on the authenticated user's map.",
      },
    );

    const ok = (data: unknown) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    });
    const err = (e: unknown) => ({
      content: [
        {
          type: 'text' as const,
          text: `Error: ${(e as Error).message ?? String(e)}`,
        },
      ],
      isError: true,
    });

    server.registerTool(
      'create_place',
      {
        title: 'Create a place',
        description:
          'Create a new place on the map (geo point + name + address + description). Returns the created place.',
        inputSchema: {
          name: z.string().min(1).describe('Display name of the place'),
          location: z
            .object({
              lat: z.number().min(-90).max(90),
              lng: z.number().min(-180).max(180),
            })
            .describe('WGS84 coordinates'),
          address: z.string().min(1).describe('Human-readable address'),
          description: z
            .string()
            .min(10)
            .describe('At least 10 characters describing the place'),
          image: z.string().url().optional().describe('Optional image URL'),
        },
      },
      async (args) => {
        try {
          const place = await this.placeService.create(
            {
              name: args.name,
              location: args.location,
              address: args.address,
              description: args.description,
              image: args.image as string,
            },
            userId,
          );
          return ok(place);
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'search_places',
      {
        title: 'Search places',
        description: 'Case-insensitive substring search over place names.',
        inputSchema: {
          query: z.string().min(1).describe('Search string'),
        },
      },
      async ({ query }) => {
        try {
          return ok(await this.placeService.search(query));
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'list_places',
      {
        title: 'List all places',
        description: 'Return every place known to the system.',
        inputSchema: {},
      },
      async () => {
        try {
          return ok(await this.placeService.findAll());
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'get_place',
      {
        title: 'Get a place',
        description: 'Fetch a single place by id.',
        inputSchema: { id: z.string().describe('Place id') },
      },
      async ({ id }) => {
        try {
          return ok(await this.placeService.findOne(id));
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'save_place',
      {
        title: 'Save a place to my map',
        description:
          "Add an existing place to the authenticated user's saved list.",
        inputSchema: { placeId: z.string().describe('Place id to save') },
      },
      async ({ placeId }) => {
        try {
          await this.savedPlaceService.create(userId, placeId);
          return ok({ saved: true, placeId });
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'list_saved_places',
      {
        title: 'List my saved places',
        description: "Return the authenticated user's saved places.",
        inputSchema: {
          limit: z.number().int().positive().optional(),
          offset: z.number().int().nonnegative().optional(),
          tagIds: z.array(z.string()).optional(),
        },
      },
      async ({ limit, offset, tagIds }) => {
        try {
          return ok(
            await this.savedPlaceService.findAll(userId, {
              limit,
              offset,
              tagIds,
            }),
          );
        } catch (e) {
          return err(e);
        }
      },
    );

    server.registerTool(
      'list_tags',
      {
        title: 'List my tags',
        description: "Return the authenticated user's tags.",
        inputSchema: {},
      },
      async () => {
        try {
          return ok(await this.tagService.findAll(userId));
        } catch (e) {
          return err(e);
        }
      },
    );

    return server;
  }
}
