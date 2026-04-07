#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  MACH:INE III — Health check
#  Diagnosi rapida del repo: import morti, magic numbers, file size.
# ═══════════════════════════════════════════════════════════

set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "── MACH:INE III health check ──"
echo ""

# 1. Import che puntano a archive/ (sospetto)
echo "[1] Import sospetti verso archive/ in src/:"
grep -rn "from '\\../archive\\|from './archive" src/ 2>/dev/null || echo "  ✓ nessuno"
echo ""

# 2. Import non risolti (file inesistenti)
echo "[2] Import a file inesistenti in src/:"
python3 - <<'PY'
import os, re
ROOT = 'src'
files = {f for f in os.listdir(ROOT) if f.endswith('.js')}
missing = []
for f in files:
    with open(os.path.join(ROOT, f)) as fh:
        for line in fh:
            m = re.search(r"from\s+'\./([a-zA-Z0-9\-_]+)\.js'", line)
            if m and m.group(1) + '.js' not in files:
                missing.append((f, m.group(1) + '.js'))
if missing:
    for src, dst in missing:
        print(f"  ✗ {src} → {dst}")
else:
    print("  ✓ tutti gli import risolti")
PY
echo ""

# 3. Magic numbers fuori da config.js (euristica: numeri >= 100 in righe non commento)
echo "[3] Magic numbers sospetti (≥100, fuori config/VERSION):"
grep -rn -E "^[^/]*[^a-zA-Z_0-9]([1-9][0-9]{2,})" src/ 2>/dev/null \
  | grep -v "src/config.js\|src/VERSION.js\|//\|MIDI\|0x\|\\.length" \
  | head -20 || echo "  ✓ pochi/nessuno"
echo ""

# 4. File >500 LOC (candidati a refactor)
echo "[4] File src/ > 500 LOC:"
find src -name "*.js" -exec wc -l {} \; | awk '$1 > 500 { print "  " $1 "  " $2 }' | sort -rn
echo ""

# 5. Conta moduli vivi
echo "[5] Moduli src/ totali: $(ls src/*.js | wc -l | tr -d ' ')"
echo "    Moduli archiviati: $(ls archive/code/dead-islands/*.js 2>/dev/null | wc -l | tr -d ' ')"
echo ""

echo "── done ──"
