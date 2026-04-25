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
import { Admin, Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import {
  CsvImportSummaryDto,
  GoogleImportSummaryDto,
  ImportSummaryDto,
} from './import.dto';
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

  @Admin()
  @Post('places-csv')
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
          description:
            'CSV file with columns: name, lat, lng, address, description (opt), image (opt)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    type: CsvImportSummaryDto,
    description: 'Bulk CSV import summary',
  })
  @ApiResponse({ status: 400, description: 'Invalid or malformed CSV' })
  async importPlacesCsv(
    @User('id') adminId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: UploadedMulterFile,
  ): Promise<CsvImportSummaryDto> {
    return this.importService.importPlacesCsv(adminId, file.buffer);
  }

  @Private()
  @Post('google')
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
          description:
            'Google Takeout "Saved places" JSON (GeoJSON FeatureCollection or legacy JSON array)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    type: GoogleImportSummaryDto,
    description: 'Google Takeout import summary',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or unrecognized Google Takeout file',
  })
  async importGoogle(
    @User('id') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ fileIsRequired: true }),
    )
    file: UploadedMulterFile,
  ): Promise<GoogleImportSummaryDto> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }
    return this.importService.importGoogle(userId, parsed);
  }
}
