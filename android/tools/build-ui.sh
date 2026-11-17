#!/bin/sh
# Bundles the WebView UI (ui/) into app/src/main/assets/ui. Needs esbuild (npx esbuild works too).
set -e
cd "$(dirname "$0")/.."
OUT=app/src/main/assets/ui
mkdir -p "$OUT"
ESBUILD=${ESBUILD:-esbuild}
$ESBUILD ui/src/app.js --bundle --format=iife --target=chrome80 --minify --legal-comments=none --outfile="$OUT/app.js"
cp ui/index.html ui/app.css "$OUT/"
echo "ui built -> $OUT"
