#!/bin/bash

# Compute the next CalVer release tag: vYYYY.MAJOR.MINOR
#
#   major -> vYYYY.(MAJOR+1).0
#   minor -> vYYYY.MAJOR.(MINOR+1)
#
# The first release of a calendar year is always vYYYY.1.0, whatever the type.
# Only tags already in the local repo are considered, so fetch tags first.
#
# Usage: scripts/next-version.sh <major|minor> [year]
set -euo pipefail

TYPE="${1:-}"
YEAR="${2:-$(date -u +%Y)}"

if [[ "$TYPE" != "major" && "$TYPE" != "minor" ]]; then
  echo "Usage: $0 <major|minor> [year]" >&2
  exit 1
fi

if [[ ! "$YEAR" =~ ^[0-9]{4}$ ]]; then
  echo "Invalid year: $YEAR" >&2
  exit 1
fi

# Latest tag for this year, ordered numerically by MAJOR then MINOR
LATEST=$(git tag --list "v${YEAR}.*" \
  | grep -E "^v${YEAR}\.[0-9]+\.[0-9]+$" \
  | sort -t. -k2,2n -k3,3n \
  | tail -n 1 || true)

if [[ -z "$LATEST" ]]; then
  echo "v${YEAR}.1.0"
  exit 0
fi

IFS=. read -r _ MAJOR MINOR <<< "$LATEST"

if [[ "$TYPE" == "major" ]]; then
  echo "v${YEAR}.$((MAJOR + 1)).0"
else
  echo "v${YEAR}.${MAJOR}.$((MINOR + 1))"
fi
