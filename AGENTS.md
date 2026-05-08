# Repository Notes

- Use `npm`, not `pnpm`: the repo is rooted by `package-lock.json` and has no `pnpm-lock.yaml`.
- Expected Node version is `20.17.0` from `.tool-versions`.
- Install deps before any verification: `npm install`.

# Verification

- Available scripts are only `npm run dev`, `npm run build`, `npm run generate`, `npm run preview`, and `npm run typecheck`.
- There is no repo lint or test config, and no CI workflow checked in.
- Default focused verification is `npm run typecheck`; use `npm run build` for a full production bundle check.

# App Shape

- This is a single-package Vue 3 + TypeScript + Vite app, not a monorepo.
- App bootstrap is `src/main.ts`: it mounts `App.vue`, registers `ElementPlus`, `vue-router`, `el-table-infinite-scroll`, and the global `MapForm` component.
- Route wiring is flat in `src/router.ts`: `/processor`, `/component`, `/processing-content`, and `/setting`.
- Most backend integration is centralized in `src/services/data.service.ts`; prefer updating service methods there instead of scattering `axios`/`fetch` calls across views.

# Runtime Quirks

- Dev API base URL comes from `VITE_API_BASE_URL` and falls back to `http://localhost:8080`; in non-dev builds the frontend calls the backend on `location.origin`.
- `src/views/Component.vue` uses SSE via `@vueuse/core` `useEventSource`; `src/views/ProcessingContent.vue` uses debounced infinite scrolling.
- `src/views/Setting.vue` reads `__APP_INFO__`, which is injected by `vite-plugin-build-info` in `vite.config.ts`.

# Styling And Imports

- Use the `~/` alias for `src/*`; it is defined in both `tsconfig.json` and `vite.config.ts`.
- SCSS files automatically receive `@use "~/styles/element/index.scss" as *;` from Vite config, so Element Plus theme variables are globally available in SCSS.
- UnoCSS is enabled directly inside `vite.config.ts`; `src/main.ts` imports `uno.css`.
- Component auto-registration is handled by `unplugin-vue-components`; `src/components.d.ts` is generated, so do not hand-edit it.
