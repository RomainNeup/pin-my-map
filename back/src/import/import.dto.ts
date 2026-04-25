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

// ── TAS-11: Admin bulk CSV import ─────────────────────────────────────────────

export class CsvImportErrorDto {
  @ApiProperty({ description: 'Row number (1-based, excluding header)' })
  row: number;
  @ApiProperty({ description: 'Error message' })
  message: string;
}

export class CsvImportSummaryDto {
  @ApiProperty({ description: 'Number of places created' })
  created: number;
  @ApiProperty({ type: [CsvImportErrorDto], description: 'Per-row errors' })
  errors: CsvImportErrorDto[];
}

// ── TAS-13: Google Takeout import ─────────────────────────────────────────────

export class GoogleImportSummaryDto {
  @ApiProperty({ description: 'Number of new Place documents created' })
  placesCreated: number;
  @ApiProperty({ description: 'Number of new SavedPlace documents created' })
  savedCreated: number;
  @ApiProperty({
    description: 'Number of entries skipped because already saved',
  })
  skipped: number;
  @ApiProperty({ type: [ImportErrorDto], description: 'Per-entry errors' })
  errors: ImportErrorDto[];
}
