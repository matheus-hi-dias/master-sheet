# Web (React + Vite) App Instructions

App-scoped conventions for `apps/web`. Global rules live in the repository root `AGENTS.md`; design/screen specs live in `docs/design-system.md` and `docs/screens/*.md`.

## Stack

React 19 + Vite 7 SPA, Tailwind CSS 4, React Query, React Hook Form + Zod, Zustand, React Router 7, lucide-react, sonner (toasts).

## Conventions

- **Folder structure:** `src/components/ui/` base components (Btn, Input, Tag, PageHeader), `src/features/<domain>/` business components and pages, `src/services/` (or `src/api/`) for API communication.
- **Componentization:** prefer pure functional components; extract complex logic into custom hooks.
- **Class merging:** use `clsx` + `tailwind-merge` through a `cn()` helper — avoid rigid static classes.
- **Dynamic forms:** render `Template.structure` with React Hook Form uncontrolled inputs and targeted subscriptions; only recalculate formula nodes when their explicit dependencies change — avoid unnecessary re-renders on complex forms.
- **Server state:** React Query for caching, autosave mutations (debounced), and Optimistic UI with rollback.
- **Design system:** follow `docs/design-system.md` (dark-first, gold accents, Cinzel/Lato, `animate-fade-in`/`dice-in`/`toast-in`).

## Commands

- Dev: `pnpm --filter web dev` · Build: `pnpm --filter web build` · Lint: `pnpm --filter web lint` · Test: `pnpm --filter web test` (jest)
- Type check: `pnpm --filter web exec tsc --noEmit`