# Repository Notes

- Use `bun`, not `npm` or `pnpm`: the repo is rooted by `bun.lock`.
- Preferred Bun version is `1.3.13` from `.tool-versions`; Node `20.17.0` is also listed but local Node is too old for direct Vite 8 CLI use.
- Install deps before any verification: `bun install`.

# Verification

- Available scripts are `bun run dev`, `bun run build`, `bun run generate`, `bun run preview`, and `bun run typecheck`.
- Vite-facing scripts already invoke `bun --bun vite ...`, which avoids the local Node `20.17.0` incompatibility with Vite 8.
- `bun run generate` is currently just an alias to `vite build`; there is no SSG flow anymore.
- There is no repo lint or test config, and no CI workflow checked in.
- Default focused verification is `bun run typecheck`; use `bun run build` for a full production bundle check.

# App Shape

- This is a single-package React + TypeScript + Vite app, not a monorepo.
- App bootstrap is `src/main.tsx`; it mounts `App.tsx` under `BrowserRouter` and `next-themes` `ThemeProvider`.
- Route wiring is flat in `src/App.tsx`: `/processor`, `/component`, `/processing-content`, and `/setting`.
- Most backend integration is centralized in `src/services/data.service.ts`; prefer updating service methods there instead of scattering `axios`/`fetch` calls across pages.

# Runtime Quirks

- Dev API base URL comes from `VITE_API_BASE_URL` and falls back to `http://localhost:8080`; in non-dev builds the frontend calls the backend on `location.origin`.
- Component state updates still use SSE against `/api/component/state-stream`; processing-content still uses debounced incremental loading.
- `src/pages/setting-page.tsx` reads `__APP_INFO__`, which is injected by `vite-plugin-build-info` in `vite.config.ts`.
- JSON editing is via Monaco (`@monaco-editor/react`); dynamic component property forms use `@rjsf/core` with the custom map field in `src/components/jsonschema/key-value-field.tsx`.
- Dependency stack has been upgraded broadly to latest releases, including React 19, React Router 7, Vite 8, and `@rjsf/*` 6.x; expect upstream API docs/examples to differ from older React 18 / Router 6 material.

# Styling And Imports

- Use the `~/` alias for `src/*`; it is defined in both `tsconfig.json` and `vite.config.ts`.
- Tailwind is the styling base; shadcn-style primitives live under `src/components/ui/`.
- Tailwind stays on the latest 3.x line (`3.4.19`) rather than 4.x because the current shadcn-style CSS/token setup is still Tailwind 3-based.
- Dark mode is class-based through `next-themes`; shared theme state lives in `src/hooks/use-dark-mode.ts`.
- Vite manual chunking already splits `react`, `monaco`, and `@rjsf/*`; keep heavy editor/form dependencies out of the main chunk when possible.
