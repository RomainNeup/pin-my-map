import { Module } from '@nestjs/common';
import { PlaceModule } from 'src/place/place.module';
import { SavedPlaceModule } from 'src/saved/saved.module';
import { TagModule } from 'src/tag/tag.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [PlaceModule, SavedPlaceModule, TagModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
