# TAS-5 — Add colors to tags

**Epic:** Tags  •  **Priority:** Nice  •  **Status:** back-ready
**Branch:** `tas-4-5-tag-colors`

## Goal

Add an optional `color` (hex `#RRGGBB`) field to tags. Surface in DTO, request DTOs, entity, mapper.

## DTO

```ts
export class TagDto {
  id: string;
  name: string;
  emoji: string;
  color?: string; // '#RRGGBB' or null/undefined when unset
}

export class CreateTagRequestDto {
  // existing fields ...
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/)
  color?: string;
}

// UpdateTagRequestDto: same optional color
```

## Entity

Add `@Prop({ required: false }) color?: string;` to `Tag`.

## Validation

- Reject any color not matching `^#[0-9a-fA-F]{6}$` with 400.

## Migration

Existing tags simply have no color — UI must default to a neutral chip color when missing.

## Frontend (front-tags)

- `front/src/lib/api/tag.ts`: extend types.
- `front/src/lib/stores/tags.ts`: pass-through.
- `front/src/routes/tags/list/+page.svelte` (or its tag-row component): color swatch + native `<input type="color">` in the create/edit modal. Persist on save.
- Tag chips in `front/src/lib/components/place/...` show the color background; default `#cbd5e1` when missing.

## Tests

Backend: validation 400 on bad hex; round-trip persistence.
