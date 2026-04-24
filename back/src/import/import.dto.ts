import { ApiProperty } from '@nestjs/swagger';

export class ImportErrorDto {
  @ApiProperty({ description: 'Index of the feature in the source file' })
  index: number;
  @ApiProperty({
    description: 'Name of the feature, when available',
    required: false,
  })
  name?: string;
  @ApiProperty({ description: 'Error message' })
  message: string;
}

export class ImportSummaryDto {
  @ApiProperty({ description: 'Number of places newly saved for the user' })
  imported: number;
  @ApiProperty({
    description: 'Number of places skipped because already saved',
  })
  skipped: number;
  @ApiProperty({ description: 'Number of features that failed to import' })
  failed: number;
  @ApiProperty({ type: [ImportErrorDto], description: 'Per-feature errors' })
  errors: ImportErrorDto[];
}
