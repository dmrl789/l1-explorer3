# Vercel API proxy for `ippan.net` / `www.ippan.net`

This Explorer is served over **HTTPS** (Vercel). The upstream IPPAN API services (`api1.ippan.uk`, `api2.ippan.uk`) are currently **HTTP**.

Browsers will block HTTPS pages from calling HTTP APIs directly (**mixed content**), and even when HTTPS is used, browser **CORS** can block cross-origin calls.

To keep the UI simple and reliable, the Explorer makes **same-origin** requests (e.g. `GET /v1/blocks`) and Vercel/Next.js proxies those requests to the upstream HTTP services.

## How it works

There are two layers:

- **Route Handlers (preferred where we need strict behavior)**:
  - Implemented under `src/app/**/route.ts`
  - Can enforce `cache-control: no-store` and add proof headers like `X-Ippan-Proxy`
- **Next.js rewrites (general proxy)**:
  - Implemented in `next.config.mjs`
  - Proxies `/v1/*` and `/finality/*` to the upstream base URL

## Environment variables

Set these in Vercel (Production + Preview):

- `UPSTREAM_RPC_BASE` — default upstream for `/v1/*` and `/finality/*`
  - Example: `http://api2.ippan.uk`
- `UPSTREAM_BLOCKS_BASE` — upstream for `/v1/blocks*` (blocks have historically been more reliable on `api1`)
  - Example: `http://api1.ippan.uk`

## Supported proxy endpoints

At minimum, the UI expects:

- `GET /v1/status`
- `GET /v1/transactions?limit=&cursor=`
- `GET /v1/blocks?limit=&cursor=`
- `GET /v1/finality/recent`
- `GET /finality/:block_id`

## Proof / debugging headers

When debugging whether requests are being handled by this deployment vs an upstream directly, look for:

- `X-Ippan-Git`: upstream build identifier (when provided by upstream)
- `X-Ippan-Proxy`: proof that a Next.js Route Handler served the request (example: `route:/v1/blocks`)

Route handlers should also send:

- `Cache-Control: no-store`

## Smoke tests (local or production)

### Production (`ippan.net`)

In PowerShell:

```powershell
$base="https://www.ippan.net"

curl.exe -sS -D - "$base/v1/blocks?limit=1" -o NUL | Select-String -Pattern "content-type:|cache-control:|x-ippan-git:|x-ippan-proxy:" | Select-Object -First 50
curl.exe -sS "$base/v1/blocks?limit=1" | Select-Object -First 5

curl.exe -sS -D - "$base/v1/status" -o NUL | Select-String -Pattern "content-type:|cache-control:|x-ippan-git:|x-ippan-proxy:" | Select-Object -First 50
curl.exe -sS "$base/v1/status" | Select-Object -First 20
```

### Browser truth-check

Open DevTools on `https://www.ippan.net` and run:

```js
await fetch("/v1/blocks?limit=1").then(r => r.json())
```

If this returns JSON but the UI is empty, the remaining issue is **frontend rendering/state**, not the proxy.

