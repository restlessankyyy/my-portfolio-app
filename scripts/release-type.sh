#!/bin/bash

# Decide the automatic release type for the commits since the last release.
#
#   none  -> no commits, or only bot commits ([bot] authors or [skip ci])
#   major -> a human commit is marked breaking (type!: subject or
#            BREAKING CHANGE in the body)
#   minor -> anything else
#
# Usage: scripts/release-type.sh <target-sha> [previous-tag]
set -euo pipefail

TARGET="${1:-}"
PREVIOUS="${2:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <target-sha> [previous-tag]" >&2
  exit 1
fi

RANGE="$TARGET"
if [[ -n "$PREVIOUS" ]]; then
  RANGE="${PREVIOUS}..${TARGET}"
fi

TYPE=none
# One record per commit: author, subject, body, separated by unit/record separators
while IFS=$'\x1f' read -r -d $'\x1e' AUTHOR SUBJECT BODY; do
  AUTHOR="${AUTHOR#$'\n'}"
  if [[ "$AUTHOR" == *"[bot]" || "$SUBJECT" == *"[skip ci]"* ]]; then
    continue
  fi
  if [[ "$SUBJECT" =~ ^[a-z]+(\([^\)]*\))?!: || "$BODY" == *"BREAKING CHANGE"* ]]; then
    echo major
    exit 0
  fi
  TYPE=minor
done < <(git log --no-merges --format='%an%x1f%s%x1f%b%x1e' "$RANGE")

echo "$TYPE"
