#!/usr/bin/env bash
# PNG-only fallback when sharp/node_modules is unavailable (macOS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INPUT="$ROOT/public/logo-source.png"
OUT="$ROOT/public/logo"
mkdir -p "$OUT"
for size in 32 48 64 96 128 192 256 512; do
  sips -z "$size" "$size" "$INPUT" --out "$OUT/icon-${size}.png" >/dev/null
done
sips -z 32 32 "$INPUT" --out "$ROOT/public/favicon-32x32.png" >/dev/null
sips -z 180 180 "$INPUT" --out "$ROOT/public/apple-touch-icon.png" >/dev/null
echo "Wrote PNG logos to public/logo/ (run pnpm run optimize-logo for WebP)"
