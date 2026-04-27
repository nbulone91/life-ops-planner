# Life Ops Planner

A polished local-first web app for budget tracking, weekly meal planning, recipes, groceries, and writing drafts.

Live site:

https://nbulone91.github.io/life-ops-planner/

## Run Locally

This version has no build step.

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Deploy

The app is static, so it can be deployed to GitHub Pages, Cloudflare Pages, Netlify, Vercel, or any static host.

For GitHub Pages, use Settings -> Pages -> Deploy from a branch -> main -> / (root).

## Current Features

- Budget chart and category progress
- Weekly meal planner with filters
- Recipe detail panel
- Grocery list add/check flow
- Writing assistant with optional backend OpenAI Responses API generation
- Browser `localStorage` persistence
- Optional multi-device sync through the Cloudflare Worker backend in `worker/`
- Export/import planner backups for moving data between devices
- Responsive desktop and mobile layout

## Sync Backend

The frontend can sync through a small Cloudflare Worker API:

- `GET /api/state?syncId=...` pulls planner data
- `PUT /api/state` saves planner data
- `POST /api/ai` generates writing drafts using a server-side OpenAI key

Users enter the same sync code on each device. The browser hashes that code before sending it to the backend.

## AI Writer

The preferred setup is server-side AI through the Cloudflare Worker with an `OPENAI_API_KEY` secret. If no backend is connected, each device can still store its own OpenAI API key locally in that browser. The browser key is not exported in planner backups.
