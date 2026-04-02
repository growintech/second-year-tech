#!/usr/bin/env bash
# final-project/bump.sh
#
# Cache-bust final-project HTML files by renaming them with a new version suffix.
# All internal cross-links are updated automatically.
#
# Usage (from repo root):   bash final-project/bump.sh
# Usage (from final-project/): bash bump.sh
#
# After running, stage everything with: git add -A

set -euo pipefail

# ── Locate directories ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FP_DIR="$SCRIPT_DIR"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$FP_DIR/.version"
ROOT_INDEX="$ROOT_DIR/index.html"

# ── Read current version (0 = first run) ────────────────────────────────────
if [[ -f "$VERSION_FILE" ]]; then
  CURRENT_V=$(cat "$VERSION_FILE")
else
  CURRENT_V=0
fi
NEW_V=$((CURRENT_V + 1))

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  final-project bump: v${CURRENT_V} → v${NEW_V}"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── The 5 base filenames (without version suffix or .html) ──────────────────
BASES=(
  "index"
  "01-problem-to-solution"
  "02-form-and-landing"
  "03-website-progress"
  "04-final-and-presentation"
)

# Version suffix strings
if [[ $CURRENT_V -eq 0 ]]; then
  suffix_old=""          # first run: source files have plain names
else
  suffix_old="-v${CURRENT_V}"
fi
suffix_new="-v${NEW_V}"

# ── Step 1: Verify source files exist ───────────────────────────────────────
echo "Checking source files..."
missing=0
for base in "${BASES[@]}"; do
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

# ── Step 2: Rename source files to new versioned names ──────────────────────
echo ""
echo "Renaming to v${NEW_V}..."
for base in "${BASES[@]}"; do
  src="$FP_DIR/${base}${suffix_old}.html"
  dst="$FP_DIR/${base}${suffix_new}.html"
  mv "$src" "$dst"
  echo "  ${base}${suffix_old}.html  →  ${base}${suffix_new}.html"
done

# ── Step 3: Update cross-references within all 5 renamed files ──────────────
echo ""
echo "Updating internal links..."
for base in "${BASES[@]}"; do
  file="$FP_DIR/${base}${suffix_new}.html"
  [[ -f "$file" ]] || continue

  sed -i '' \
    -e "s|href=\"index${suffix_old}\.html\"|href=\"index${suffix_new}.html\"|g" \
    -e "s|href=\"01-problem-to-solution${suffix_old}\.html\"|href=\"01-problem-to-solution${suffix_new}.html\"|g" \
    -e "s|href=\"02-form-and-landing${suffix_old}\.html\"|href=\"02-form-and-landing${suffix_new}.html\"|g" \
    -e "s|href=\"03-website-progress${suffix_old}\.html\"|href=\"03-website-progress${suffix_new}.html\"|g" \
    -e "s|href=\"04-final-and-presentation${suffix_old}\.html\"|href=\"04-final-and-presentation${suffix_new}.html\"|g" \
    "$file"
  echo "  links updated: ${base}${suffix_new}.html"
done

# ── Step 4: Update root index.html ──────────────────────────────────────────
echo ""
echo "Updating root index.html..."
if [[ $CURRENT_V -eq 0 ]]; then
  # First run: replace bare directory link with versioned file
  sed -i '' \
    -e "s|href=\"\./final-project/\"|href=\"./final-project/index${suffix_new}.html\"|g" \
    "$ROOT_INDEX"
else
  # Subsequent runs: replace old versioned link with new
  sed -i '' \
    -e "s|href=\"\./final-project/index${suffix_old}\.html\"|href=\"./final-project/index${suffix_new}.html\"|g" \
    "$ROOT_INDEX"
fi
echo "  root/index.html updated"

# ── Step 5: Write new version ───────────────────────────────────────────────
echo "$NEW_V" > "$VERSION_FILE"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "Done. Version is now v${NEW_V}."
echo ""
echo "Files to stage:"
echo "  index.html (root)"
for base in "${BASES[@]}"; do
  echo "  final-project/${base}${suffix_new}.html"
done
echo "  final-project/.version"
echo ""
echo "Next: git add -A  →  /git-commit  →  git push"
