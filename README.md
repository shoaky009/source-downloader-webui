# SourceDownloader Web UI

React + TypeScript + Vite frontend for SourceDownloader.

## Setup

- Node `20.17.0` from `.tool-versions`
- `npm install`

## Scripts

- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm run preview`

## Notes

- Dev API base URL comes from `VITE_API_BASE_URL` and falls back to `http://localhost:8080`.
- Build info on `/setting` comes from `vite-plugin-build-info` via `__APP_INFO__`.
