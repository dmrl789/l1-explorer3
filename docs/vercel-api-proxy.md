# Vercel API proxy for `ippan.net` / `www.ippan.net`

This Explorer is served over **HTTPS** (Vercel). The upstream IPPAN API services (`api1.ippan.uk`, `api2.ippan.uk`, `gateway.ippan.net`, etc.) are currently **HTTP**.

Browsers will block HTTPS pages from calling HTTP APIs directly (**mixed content**), and even when HTTPS is used, browser **CORS** can block cross-origin calls.

To keep the UI resilient, the Explorer makes **same-origin** requests (e.g. `GET /v1/blocks`) and Vercel/Next.js proxies those requests to the upstream HTTP services.

## How it works

- **Route Handler (primary)** — implemented at `src/app/v1/[...path]/route.ts`.
  - Proxies every `/v1/*` call through `POST`, `PUT`, `GET`, `PATCH`, and `DELETE`.
  - Enforces fail-fast `PROXY_TIMEOUT_MS`, `PROXY_RETRIES`, and fallback upstream rotation via `UPSTREAM_V1_BASES`.
  - Adds micro-caching for hot polling clients (`PROXY_CACHE_TTL_MS`), CDN-friendly cache control, and debug headers.
  - Supports an optional secret header handled by `EXPLORER_PROXY_KEY`.
- **Next.js rewrites (secondary)** — defined in `next.config.mjs`.
  - Only rewrites `/finality/*` to the first entry in `UPSTREAM_V1_BASES` so server-generated `finality_cert_endpoint` links keep working.

## Environment variables

Set these in Vercel (Production + Preview):

- `UPSTREAM_V1_BASES` — comma-separated upstream gateway bases (HTTPS preferred).
  - **Rule**: List **only healthy upstreams**. Do not include known-bad upstreams (e.g. 504/60s) as they add delay during rotation.
  - **Preference**: Use **HTTPS** upstreams (gateway or TLS on api2) as soon as available.
  - Example: `https://gateway.ippan.net`.
- `EXPLORER_PROXY_KEY` — optional shared secret header (`X-IPPAN-Explorer-Key`) sent to each upstream request.
- `PROXY_TIMEOUT_MS` — request timeout in milliseconds; defaults to `3500`.
- `PROXY_RETRIES` — number of extra upstream attempts; defaults to `2`.
- `PROXY_CACHE_TTL_MS` — in-memory cache TTL in milliseconds for hot GETs; defaults to `1000`.

For local testing, copy the `.env.local` template at the repo root and customize as needed.

## Infrastructure & SSH

See [docs/ops/ssh-keys.md](ops/ssh-keys.md) for a list of authorized SSH keys used for managing devnet nodes.

## Supported proxy endpoints

At minimum, the UI expects the following:

- `GET /v1/status`
- `GET /v1/transactions?limit=&cursor=`
- `GET /v1/blocks?limit=&cursor=`
- `GET /v1/finality/recent`
- `GET /finality/:block_id`
- `GET /v1/_debug` — exposes the upstream list + timeout/retry configuration for the running deployment.

## Proof / debugging headers

Look for these headers to confirm requests are proxied through this deployment:

- `x-ippan-proxy` — indicates `route:/v1/[...path]` served the request.
- `x-ippan-proxy-upstream` — which upstream base handled the request.
- `x-ippan-proxy-ms` — how long the upstream call took.
- `x-ippan-proxy-cache` — `HIT` or `MISS` for the micro-cache layer.
- `x-ippan-git` / `x-ippan-build-time` — passed through from the upstream when available.

All responses from `/v1/*` include `cache-control: public, s-maxage=..., stale-while-revalidate=...` (unless `PROXY_CACHE_TTL_MS` is `0`, in which case `no-store` is sent).

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

