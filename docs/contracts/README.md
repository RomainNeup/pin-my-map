# API Contracts — Source of truth for back ↔ front agreement

Each ticket gets a file `TAS-XX.md` in this directory. The backend agent **must** match the contract; the frontend agent **must** consume only what the contract documents. Any deviation requires editing the contract first.

## Contract template

```markdown
# TAS-XX — <short title>

**Epic:** <epic>  •  **Owner-back:** <agent name>  •  **Owner-front:** <agent name>
**Branch:** `tas-XX-<slug>`  •  **Status:** draft | back-ready | front-ready | merged

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | /foo | @Private | … |

## DTOs

```ts
// request
export class FooRequestDto { … }
// response
export class FooResponseDto { … }
```

## Error cases

- 400 — validation
- 401 — missing token
- 403 — wrong role
- 404 — not found

## Gamification

- Action: `foo_action` | none
- Points: 5 | n/a

## Audit

- Logged: yes / no — what action name?

## Frontend usage

- Route: `/foo/bar`
- Store: `lib/stores/foo.ts`
- API client: `lib/api/foo.ts`

## Notes

Implementation hints, edge cases, dependencies.
```

## Workflow

1. Manager drafts contract → `status: draft`.
2. Backend agent updates contract to `status: back-ready` after committing DTOs + Swagger.
3. Frontend agent picks up contract; promotes to `status: front-ready` after wiring.
4. Manager promotes to `status: merged` after smoke test.

Deviations: agent edits contract, sends `SendMessage` to manager, waits for re-broadcast.
