# SourceDownloader Web UI

React + TypeScript + Vite frontend for SourceDownloader.

## Setup

- Bun `1.3.13` from `.tool-versions`
- `bun install`

## Scripts

- `bun run dev`
- `bun run typecheck`
- `bun run build`
- `bun run preview`

## Notes

- Dev API base URL comes from `VITE_API_BASE_URL` and falls back to `http://localhost:8080`.
- Build info on `/setting` comes from `vite-plugin-build-info` via `__APP_INFO__`.
- This repo now uses `bun.lock` as the source-of-truth lockfile.
- Scripts already invoke Vite through `bun --bun`, so `bun run dev` and `bun run build` work even with local Node `20.17.0`.
