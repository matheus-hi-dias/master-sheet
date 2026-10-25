# API (NestJS) App Instructions

App-scoped conventions for `apps/api`. Global rules live in the repository root `AGENTS.md`; current contracts live in `openspec/specs/` and `docs/api/contracts.md`.

## Stack

NestJS 11, Prisma 7 (PostgreSQL), Passport-JWT, bcrypt, `@nestjs/throttler`, `class-validator`/`class-transformer`, `@nestjs/swagger`, Joi env validation via `ConfigService`.

Critical: raw `process.env` is forbidden — always inject `ConfigService`.

## Conventions

- **Modules:** one per core entity (`src/auth`, `src/templates`, `src/sheets`, `src/tags`) with controller + service.
- **DTOs:** mandatory for every payload; reuse with `PickType`/`PartialType`; recursive validation for `Template.structure` / `Sheet.data`.
- **Controllers are thin:** put heavy logic (attribute modifiers, formula parsing) in services.
- **Errors:** built-in NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, ...).
- **Guards:** `JwtAuthGuard` for protected routes; `OwnerGuard`/`TemplateAccessGuard` for ownership and public-read semantics; extract the user via `@GetCurrentUser()`.
- **Tags:** always `connectOrCreate` on the normalized name; respect the dual Template/Sheet scope.
- **Swagger:** annotate controllers and handlers with `@ApiTags` and `@ApiOperation`.

## Commands

- Run: `pnpm --filter api start:dev`
- Migrations: `pnpm --filter api exec prisma migrate dev --name <short_name>` (schema at `apps/api/prisma/schema.prisma`)
- Generate client: `pnpm --filter api exec prisma generate`
- Tests: `pnpm --filter api test` (jest, `*.spec.ts`)

## Testing

- Add unit specs for pure logic (attribute calculations, token rotation); e2e specs under `test/` for contract-level flows.