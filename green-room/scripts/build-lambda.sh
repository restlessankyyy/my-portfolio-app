#!/usr/bin/env bash
# Build the Lambda deployment package (greenroom-lambda.zip) consumed by
# Terraform and the CI/CD deploy step. Produces a package with only production
# dependencies plus the runtime files (no dev tooling, no infra code).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
OUT_ZIP="${ROOT_DIR}/terraform/greenroom-lambda.zip"

cleanup() { rm -rf "${BUILD_DIR}"; }
trap cleanup EXIT

echo "==> Installing production dependencies"
if [ -f "${ROOT_DIR}/package-lock.json" ]; then
  cp "${ROOT_DIR}/package.json" "${ROOT_DIR}/package-lock.json" "${BUILD_DIR}/"
  ( cd "${BUILD_DIR}" && npm ci --omit=dev --no-audit --no-fund )
else
  cp "${ROOT_DIR}/package.json" "${BUILD_DIR}/"
  ( cd "${BUILD_DIR}" && npm install --omit=dev --no-audit --no-fund )
fi

echo "==> Copying runtime files"
cp "${ROOT_DIR}/server.js" "${ROOT_DIR}/lambda.js" "${BUILD_DIR}/"
cp -R "${ROOT_DIR}/public" "${BUILD_DIR}/public"

echo "==> Creating package"
mkdir -p "${ROOT_DIR}/terraform"
rm -f "${OUT_ZIP}"
( cd "${BUILD_DIR}" && zip -qr "${OUT_ZIP}" . -x '*.DS_Store' )

echo "==> Done: $(du -h "${OUT_ZIP}" | cut -f1) ${OUT_ZIP}"
