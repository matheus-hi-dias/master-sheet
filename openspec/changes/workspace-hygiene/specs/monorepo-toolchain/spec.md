## ADDED Requirements

### Requirement: Uniform Workspace Task Contract

Every application workspace SHALL implement `lint`, `check-types`, and `test` scripts. `build` SHALL be implemented by `@master-sheet/api` and `@master-sheet/web`; `@master-sheet/mobile` SHALL be exempt from `build` (EAS/Expo owns native builds) and SHALL document that exemption in its manifest or README.

#### Scenario: CI runs every required task per app
- **WHEN** `pnpm turbo run lint check-types test` executes at the repository root
- **THEN** each of `api`, `web`, and `mobile` executes all three tasks and a non-zero exit from any of them fails the run

#### Scenario: Mobile is exempt from build only
- **WHEN** the workspace task contract is verified
- **THEN** `mobile` is permitted to omit `build` and is rejected if it omits `lint`, `check-types`, or `test`

### Requirement: Fail-Closed CI Verification

CI SHALL verify the workspace task contract before executing Turborepo tasks and SHALL fail when a workspace is missing a required script, rather than silently skipping it.

#### Scenario: Missing script fails the pipeline
- **WHEN** a workspace manifest omits a required script
- **THEN** the CI quality job fails before running `turbo run` and identifies the workspace and missing script

#### Scenario: Orphan workspace directory detected
- **WHEN** a directory matches a workspace glob but contains no `package.json`
- **THEN** verification fails and names the directory

### Requirement: Shared Configuration Is Consumed

Application workspaces SHALL extend the shared TypeScript configuration from `@master-sheet/typescript-config` for settings that are common across apps. ESLint configuration SHALL come from `@master-sheet/eslint-config` unless an app has a documented framework-specific exception.

#### Scenario: App inherits shared compiler settings
- **WHEN** a shared compiler option (for example `strict` or `skipLibCheck`) changes in `@master-sheet/typescript-config`
- **THEN** every app that extends it picks up the change without editing its own `tsconfig`

#### Scenario: Difference is explicit, not duplicated
- **WHEN** an app requires framework-specific compiler options (NestJS decorators for `api`, Vite bundler mode for `web`, Expo base for `mobile`)
- **THEN** the app extends the shared config and overrides only the required options

#### Scenario: API ESLint exception is documented
- **WHEN** `api` uses a NestJS-specific ESLint configuration instead of `@master-sheet/eslint-config`
- **THEN** the reason is recorded in the workspace README or config comment and the shared package does not claim to cover it

### Requirement: Consistent Workspace Identity

All workspace packages and applications SHALL use the `@master-sheet/` scope, SHALL be marked `private: true`, and SHALL declare a `version`.

#### Scenario: Filter uses the scoped name
- **WHEN** a maintainer or CI filters a workspace
- **THEN** the command uses a `@master-sheet/*` name and no unscoped app name remains in scripts or documentation

### Requirement: No Starter Residue

The workspace SHALL NOT contain directories that match workspace globs without a manifest, packages that no application consumes, or build outputs for frameworks the repository does not use.

#### Scenario: Unused shared package removed
- **WHEN** the workspace is inspected
- **THEN** every package under `packages/` is imported by at least one application or is explicitly marked as incubating in its README

#### Scenario: Framework residue removed
- **WHEN** configuration is inspected
- **THEN** there are no Next.js ESLint exports or `.next` build outputs because the repository contains no Next.js application

### Requirement: Reproducible Generated Artifacts

Generated artifacts required for compilation, including the Prisma client, SHALL be produced as part of the Turborepo task graph rather than relying solely on a package `postinstall` hook.

#### Scenario: Fresh checkout builds without manual generation
- **WHEN** a clean checkout runs `pnpm build` with dependencies installed
- **THEN** the Prisma client is generated before `api` compiles and the build succeeds without a manual `prisma generate`

### Requirement: Dependency Isolation

The root workspace SHALL NOT disable pnpm dependency isolation. Node linker hoisting MAY be enabled only in a workspace that requires it, with the reason documented.

#### Scenario: Phantom dependency is caught
- **WHEN** a workspace imports a package it does not declare
- **THEN** the install/build fails and the dependency must be declared explicitly

#### Scenario: Mobile keeps required hoisting
- **WHEN** Expo/Metro requires hoisted node modules
- **THEN** `apps/mobile/.npmrc` may set `node-linker=hoisted` and that exception is documented

### Requirement: Accurate Root Documentation

The root README SHALL describe the actual product, workspace map, task commands, and environment files. It SHALL NOT contain template boilerplate or references to applications that do not exist.

#### Scenario: New contributor follows the README
- **WHEN** a contributor reads the root README and runs the documented install, env, and dev commands
- **THEN** the commands match the manifests and start the documented applications

### Requirement: Single Formatting Contract

The repository SHALL define Prettier configuration at the root and SHALL apply it consistently to all TypeScript, TSX, JSON, and Markdown files through the root `format` script.

#### Scenario: Formatting is consistent across apps
- **WHEN** a contributor runs the root format command
- **THEN** files in every app and package are formatted according to the same root configuration and no app-local Prettier config overrides it
