# Websem Web Project Guidelines

## Scope and Architecture

- This repository contains the frontend only. Do not modify `/home/amine/GitHub/websem-api` unless the user explicitly requests a backend change.
- Keep API access in `lib/services/`; use the shared Ky client and parse responses with schemas from `lib/schemas/`.
- Keep reusable domain and API types in `lib/types/`, not inside components. Keep reusable Zod payload and form schemas in `lib/schemas/`.
- Use TanStack Query for server state and mutations. Invalidate the relevant query keys after successful mutations instead of maintaining duplicate manual refresh state.
- Use React Hook Form with Zod resolvers for user-editable forms. Do not add ad-hoc form state or duplicate validation in components.
- When building or extending forms, follow the attached React Hook Form guidance: define the Zod schema first, use `useForm` with `zodResolver`, use shadcn `Field`/`FieldLabel`/`FieldError` primitives for accessible fields, and use `Controller` for controlled shadcn inputs such as selects, checkboxes, radio groups, switches, and complex or array fields. Show schema errors next to the invalid field and reset forms through React Hook Form APIs.
- Preserve the role and route protections implemented by `proxy.ts`; any UI visibility rule must agree with the backend-supported RBAC behavior.

## UI and Styling

- Treat `app/globals.css` as the design-token source of truth. Do not edit it unless explicitly requested.
- Use semantic token classes (`background`, `foreground`, `card`, `primary`, `muted`, `border`, `input`, `ring`, `destructive`, and their foreground variants). Do not introduce raw palette classes or arbitrary colors.
- Use `cn` from `lib/utils.ts` for conditional, merged, or dynamically composed class names. Do not build conditional class strings with manual template literals or string concatenation.
- Prefer existing shadcn components from `components/ui/` for controls, dialogs, feedback, and layout primitives. Do not add native controls or raw buttons when an appropriate shadcn component exists.
- Preserve the existing Tailwind formatting conventions and run Prettier with `prettier-plugin-tailwindcss` after UI changes.

## Code Quality and Validation

- Keep ESLint strict. Never disable rules, downgrade errors to warnings, or bypass hooks/query/type-safety rules to make code pass.
- Read the relevant Next.js guidance under `node_modules/next/dist/docs/` before changing Next.js routing, proxy, or framework APIs.
- Run the smallest relevant checks after changes; for frontend changes use:
  - `bun run lint`
  - `bunx tsc --noEmit`
  - `bun run build`
  - `git diff --check`
- Preserve unrelated worktree changes and do not edit generated or unrelated files.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
