#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  MACH:INE III — Snapshot script
#  Crea uno snapshot taggato dei file critici prima di edit grossi.
#  Uso: ./scripts/snapshot.sh [label]
# ═══════════════════════════════════════════════════════════

set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

LABEL="${1:-snapshot}"
TS="$(date +%Y-%m-%d-%H%M%S)"
TAG="snapshot-${LABEL}-${TS}"

# Tag git locale
git tag "$TAG"
echo "✓ Tag git creato: $TAG"

# Copia files critici in archive/code/versions
DEST="archive/code/versions/${TS}-${LABEL}"
mkdir -p "$DEST"
cp index.html projector.html "$DEST/" 2>/dev/null || true
cp -r src "$DEST/src"
echo "✓ Snapshot in $DEST"

echo ""
echo "Per rimuovere il tag: git tag -d $TAG"
