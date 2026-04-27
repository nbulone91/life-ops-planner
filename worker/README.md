# Life Ops Planner API

Cloudflare Worker backend for Life Ops Planner sync and AI.

## What It Does

- Stores planner data in Cloudflare KV by hashed sync code.
- Lets every device with the same sync code pull and push the same planner state.
- Calls OpenAI from the server so the API key is not stored on phones or browsers.

## Deploy

```bash
npm install
npm run kv:create
```

Copy the namespace id from the command output into `wrangler.jsonc` under `kv_namespaces[0].id`, then run:

```bash
npm run secret:openai
npm run deploy
```

After deploy, copy the Worker URL. In the live planner, click `Connect sync`, paste the Worker URL, and enter the same sync code on each device.

## Endpoints

- `GET /api/health`
- `GET /api/state?syncId=<sha256-sync-code>`
- `PUT /api/state`
- `POST /api/ai`
