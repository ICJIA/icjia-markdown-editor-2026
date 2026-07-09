#!/usr/bin/env bash
#
# nuke-nuxt — remove Nuxt build outputs and framework caches so `yarn dev`
# starts from a clean slate.
#
# Every target is gitignored and regenerable. node_modules and .netlify are
# left alone; use `yarn install` if you need to rebuild those.
#
# Usage:
#   ./nuke-nuxt.sh              remove caches, then regenerate types
#   ./nuke-nuxt.sh --dry-run    show what would be removed, change nothing
#
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

cd "$(dirname "${BASH_SOURCE[0]}")"

# Refuse to run anywhere but this project, since we are about to rm -rf.
if ! grep -q '"name": "icjia-markdown-editor"' package.json 2>/dev/null; then
  echo "error: refusing to run — $(pwd) is not the icjia-markdown-editor root" >&2
  exit 1
fi

TARGETS=(
  .nuxt
  .output
  .nitro
  .data
  dist
  node_modules/.vite
  node_modules/.cache
)

# Render a KB count the way `du -h` would.
human() {
  awk -v kb="$1" 'BEGIN {
    if (kb >= 1048576) printf "%.1fG", kb / 1048576
    else if (kb >= 1024) printf "%.1fM", kb / 1024
    else printf "%dK", kb
  }'
}

echo
freed_kb=0
removed=0

for target in "${TARGETS[@]}"; do
  if [[ ! -e "$target" ]]; then
    printf '  skipping  %-20s %8s\n' "$target" "(absent)"
    continue
  fi

  size_kb=$(du -sk "$target" | cut -f1)
  freed_kb=$((freed_kb + size_kb))
  removed=$((removed + 1))

  if $DRY_RUN; then
    printf '  would rm  %-20s %8s\n' "$target" "$(human "$size_kb")"
  else
    printf '  removing  %-20s %8s\n' "$target" "$(human "$size_kb")"
    rm -rf "$target"
  fi
done

if $DRY_RUN; then
  echo
  echo "  dry run — nothing removed ($(human "$freed_kb") would be freed)"
  exit 0
fi

if [[ $removed -eq 0 ]]; then
  echo
  echo "  already clean — nothing to remove"
  exit 0
fi

# Rebuild .nuxt/types so typecheck and the IDE work without a full `yarn dev`.
# Skipped when node_modules is absent; `yarn install` runs prepare via postinstall.
if [[ -x node_modules/.bin/nuxt ]]; then
  echo
  echo "  regenerating types (nuxt prepare)..."
  node_modules/.bin/nuxt prepare >/dev/null 2>&1 \
    || echo "  warning: nuxt prepare failed — run 'yarn install' to recover" >&2
fi

echo
echo "  freed $(human "$freed_kb") — run \`yarn dev\` for a clean start"
echo
