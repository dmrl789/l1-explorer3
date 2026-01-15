# Finality & Status KPIs (Explorer Evidence)

This note explains what the explorer dashboard is proving when it renders **Network Health**, **IPPAN Time**, **Finality**, and the evidence panel.

## What the dashboard proves

- **`/v1/status`**: A compact “node health + consensus telemetry” snapshot intended for dashboards.
  - Confirms the node is reachable and serving the canonical status schema.
  - Includes fields related to **UTC anchoring** and **finality writer** telemetry.
- **`/v1/finality/recent`**: Recent finality certificates (when enabled), used as an external proof surface that certs exist.

## Meaning of key fields

### Finality writer telemetry

- **`finality_writer_enabled`**: Whether the node is configured to emit/track finality certificates.
- **`finality_writer_last_error`**: The last observed write/scan error (null if none recently).
- **`finality_writer_last_success_us`**: Unix timestamp (microseconds) of the last successful event. This means:
  - the node **observed** an existing non-provisional certificate, **or**
  - the node **wrote** a certificate successfully (depending on deployment mode).

### Sampled certificate visibility

- **`finality_certs_count_sampled`** and **`finality_certs_scan_window`**: A bounded, truthful sample for quick health checks.
  - This is intentionally **not** an unbounded full database scan.
  - Interpreting it:
    - “\(2000/2000\)” suggests many certs are visible in the scan window.
    - “\(1/2000\)” suggests cert visibility is limited in that window (or the upstream is slower/has different indexing).

### Finality certificate links

Some API responses may include a field like **`finality_cert_endpoint: "/finality/<id>"`**. The explorer proxies this endpoint via the same upstream as `/v1/*`.

## Operational note: why “no data” happens on `www.ippan.net`

If the site is HTTPS and the browser tries to call an HTTP upstream directly, modern browsers block it as **mixed content**, making the UI appear empty.

The explorer is designed to avoid that by:

- having the browser call **same-origin**: `GET /v1/...`
- having the Next.js server proxy `/v1/*` (and `/finality/*`) to the configured upstream

## Recommended upstream default

In production, prefer a “fast” upstream (often **`api2`**) and keep a safe fallback (often **`api1`**) for resiliency.

