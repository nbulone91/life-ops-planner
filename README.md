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
- Writing assistant with optional OpenAI Responses API generation
- Browser `localStorage` persistence
- Export/import planner backups for moving data between devices
- Responsive desktop and mobile layout

## AI Writer

The static GitHub Pages version does not include a shared server secret. Each device can store its own OpenAI API key locally in that browser. The key is not exported in planner backups.
