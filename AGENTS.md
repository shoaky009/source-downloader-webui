# Repository Notes

- Use `npm`, not `pnpm`: the repo is rooted by `package-lock.json` and has no `pnpm-lock.yaml`.
- Expected Node version is `20.17.0` from `.tool-versions`.
- Install deps before any verification: `npm install`.

# Verification

- Available scripts are `npm run dev`, `npm run build`, `npm run generate`, `npm run preview`, and `npm run typecheck`.
- `npm run generate` is currently just an alias to `vite build`; there is no SSG flow anymore.
- There is no repo lint or test config, and no CI workflow checked in.
- Default focused verification is `npm run typecheck`; use `npm run build` for a full production bundle check.

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

# Styling And Imports

- Use the `~/` alias for `src/*`; it is defined in both `tsconfig.json` and `vite.config.ts`.
- Tailwind is the styling base; shadcn-style primitives live under `src/components/ui/`.
- Dark mode is class-based through `next-themes`; shared theme state lives in `src/hooks/use-dark-mode.ts`.
- Vite manual chunking already splits `react`, `monaco`, and `@rjsf/*`; keep heavy editor/form dependencies out of the main chunk when possible.
