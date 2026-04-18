#!/usr/bin/env bash
# Fails if any public-facing artifact leaks the internal string "ippancent".
#
# Scope:
#   - src/        : source tree that ships to the browser / Vercel runtime.
#   - public/     : static assets.
#   - .next/      : built output (run `npm run build` first in CI).
#
# Out of scope:
#   - node_modules/: third-party code; not our public identity surface.
#   - scripts/ , *.md docs: internal only.
#
# Exit codes:
#   0 — clean
#   1 — leak detected

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TARGETS=()
[[ -d src    ]] && TARGETS+=(src)
[[ -d public ]] && TARGETS+=(public)
[[ -d .next  ]] && TARGETS+=(.next)

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  echo "check-no-ippancent: nothing to scan" >&2
  exit 0
fi

# Use ripgrep if present, fall back to grep.
if command -v rg >/dev/null 2>&1; then
  MATCHES="$(rg -i --hidden --no-ignore-vcs \
    -g '!node_modules' -g '!.git' -g '!scripts/check-no-ippancent.sh' \
    'ippancent' "${TARGETS[@]}" || true)"
else
  MATCHES="$(grep -R -I -i -n \
    --exclude-dir=node_modules --exclude-dir=.git \
    --exclude=check-no-ippancent.sh \
    'ippancent' "${TARGETS[@]}" || true)"
fi

if [[ -n "$MATCHES" ]]; then
  echo "check-no-ippancent: internal identifier leaked into a public-facing path:" >&2
  echo "$MATCHES" >&2
  exit 1
fi

echo "check-no-ippancent: OK — no 'ippancent' strings in ${TARGETS[*]}"
