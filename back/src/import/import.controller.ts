import {
  BadRequestException,
  Controller,
  HttpCode,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { ImportSummaryDto } from './import.dto';
import { ImportService } from './import.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('import')
@ApiTags('Import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Private()
  @Post('mapstr')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Mapstr GeoJSON export file',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    type: ImportSummaryDto,
    description: 'Import summary',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or unreadable Mapstr file',
  })
  async importMapstr(
    @User('id') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: UploadedMulterFile,
  ): Promise<ImportSummaryDto> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }
    return this.importService.importMapstr(userId, parsed);
  }
}
