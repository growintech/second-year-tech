#!/usr/bin/env bash
# final-project/bump.sh
#
# Cache-bust final-project pages by renaming them with a new version suffix.
#
# final-project/index.html is a permanent redirect shell — it is NEVER renamed.
# Its redirect target is updated to point to the new versioned index on each bump.
#
# Usage (from repo root):      bash final-project/bump.sh
# Usage (from final-project/): bash bump.sh
#
# After running: git add -A → /git-commit → git push

set -euo pipefail

# ── Locate directories ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FP_DIR="$SCRIPT_DIR"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$FP_DIR/.version"
REDIRECT_SHELL="$FP_DIR/index.html"
ROOT_INDEX="$ROOT_DIR/index.html"

# ── Read current version ─────────────────────────────────────────────────────
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: .version file not found in final-project/. Aborting." >&2
  exit 1
fi
CURRENT_V=$(cat "$VERSION_FILE")
NEW_V=$((CURRENT_V + 1))
suffix_old="-v${CURRENT_V}"
suffix_new="-v${NEW_V}"

echo ""
echo "╔══════════════════════════════════════════════╗"
printf "║  final-project bump: v%s → v%s%*s║\n" "$CURRENT_V" "$NEW_V" "$((40 - ${#CURRENT_V} - ${#NEW_V} - 20))" " "
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Versioned content files (all renamed each bump) ──────────────────────────
ALL_BASES=(
  "index"
  "01-problem-to-solution"
  "02-form-and-landing"
  "03-website-progress"
  "04-final-and-presentation"
)

# ── Step 1: Verify all current versioned content files exist ─────────────────
echo "Checking source files..."
missing=0
for base in "${ALL_BASES[@]}"; do
  src="$FP_DIR/${base}${suffix_old}.html"
  if [[ ! -f "$src" ]]; then
    echo "  ✗ MISSING: ${base}${suffix_old}.html"
    missing=1
  else
    echo "  ✓ found:   ${base}${suffix_old}.html"
  fi
done
if [[ $missing -eq 1 ]]; then
  echo ""
  echo "ERROR: One or more source files are missing. Aborting." >&2
  exit 1
fi

# ── Step 2: Rename all versioned files to new version (mv = rename, no copy) ─
echo ""
echo "Renaming to v${NEW_V}..."
for base in "${ALL_BASES[@]}"; do
  mv "$FP_DIR/${base}${suffix_old}.html" "$FP_DIR/${base}${suffix_new}.html"
  echo "  ${base}${suffix_old}.html  →  ${base}${suffix_new}.html"
done

# ── Step 3: Update all internal cross-links within the renamed files ──────────
echo ""
echo "Updating internal links..."
for base in "${ALL_BASES[@]}"; do
  file="$FP_DIR/${base}${suffix_new}.html"
  [[ -f "$file" ]] || continue
  sed -i '' \
    -e "s|href=\"index${suffix_old}\.html\"|href=\"index${suffix_new}.html\"|g" \
    -e "s|href=\"01-problem-to-solution${suffix_old}\.html\"|href=\"01-problem-to-solution${suffix_new}.html\"|g" \
    -e "s|href=\"02-form-and-landing${suffix_old}\.html\"|href=\"02-form-and-landing${suffix_new}.html\"|g" \
    -e "s|href=\"03-website-progress${suffix_old}\.html\"|href=\"03-website-progress${suffix_new}.html\"|g" \
    -e "s|href=\"04-final-and-presentation${suffix_old}\.html\"|href=\"04-final-and-presentation${suffix_new}.html\"|g" \
    "$file"
  echo "  updated: ${base}${suffix_new}.html"
done

# ── Step 4: Update redirect shell (final-project/index.html) ─────────────────
# This file is never renamed — only its redirect target changes.
echo ""
echo "Updating redirect shell..."
sed -i '' \
  -e "s|index${suffix_old}\.html|index${suffix_new}.html|g" \
  "$REDIRECT_SHELL"
echo "  final-project/index.html → now redirects to index${suffix_new}.html"

# ── Step 5: Update direct link in root index.html ────────────────────────────
echo ""
echo "Updating root index.html..."
sed -i '' \
  -e "s|href=\"\./final-project/index${suffix_old}\.html\"|href=\"./final-project/index${suffix_new}.html\"|g" \
  "$ROOT_INDEX"
echo "  root/index.html updated"

# ── Step 6: Write new version ───────────────────────────────────────────────
echo "$NEW_V" > "$VERSION_FILE"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Done. Version is now v${NEW_V}."
echo ""
echo "Files to stage:"
echo "  index.html (root)"
echo "  final-project/index.html (redirect shell)"
for base in "${ALL_BASES[@]}"; do
  echo "  final-project/${base}${suffix_new}.html"
done
echo "  final-project/.version"
echo ""
echo "Next: git add -A  →  /git-commit  →  git push"
