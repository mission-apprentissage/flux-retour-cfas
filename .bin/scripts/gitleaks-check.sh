#!/usr/bin/env bash

set -euo pipefail

# all (défaut, hook local) : changements non commités ; ci : diff BASE_SHA..HEAD_SHA (GitHub Actions)
DIFF_MODE="${1:-all}"

# un mode invalide ferait retomber le scanner silencieusement sur "staged" (no-op en CI)
case "$DIFF_MODE" in
  all|ci|staged|history) ;;
  *) echo "❌ invalid diff mode: $DIFF_MODE (expected all|ci|staged|history)"; exit 1 ;;
esac

# en mode ci, un BASE_SHA vide ferait passer le scan pour un no-op vert
if [ "$DIFF_MODE" = "ci" ] && { [ -z "${BASE_SHA:-}" ] || [ -z "${HEAD_SHA:-}" ]; }; then
  echo "❌ BASE_SHA and HEAD_SHA env vars are required in ci mode"
  exit 1
fi

rm -f "report.json"

echo "generating report"
yarn run gitleaks-secret-scanner --diff-mode "$DIFF_MODE" -f json -r "report.json" || true

if [ ! -f "report.json" ]; then
  echo "❌ gitleaks scanner failed: no report generated"
  exit 1
fi

TMP_FINGERPRINTS="gitleaks-fingerprints-tmp.txt"

echo "generating fingerprints"
cat "report.json" | jq -r '.[] | .File + ":" + .RuleID + ":" + .Secret' | sort | uniq > "$TMP_FINGERPRINTS"

echo "deleting report"
rm -f "report.json"

HAS_ERROR="0"

while read -r line; do
  if ! grep -Fqx -- "$line" "gitleaks-fingerprints-baseline.txt"; then

    HAS_ERROR="1"
    echo "missing secret: $line"
  fi
done < "$TMP_FINGERPRINTS"

rm -f "$TMP_FINGERPRINTS"
if [ $HAS_ERROR = "1" ] ; then
    echo "❌ new errors detected !"
    exit 1
else
    echo "✅ no new error"
fi
