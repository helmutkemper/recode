#!/usr/bin/env bash
# Enable Docker Buildx and create a named builder for multi-arch builds.
# Works on macOS (Docker Desktop), Linux, and WSL2.
# Usage:
#   chmod +x scripts/enable-buildx.sh
#   ./scripts/enable-buildx.sh

set -euo pipefail
BUILDER_NAME=${1:-recode-builder}

echo "[INFO] Checking buildx..."
docker buildx version >/dev/null 2>&1 || {
  echo "[ERROR] buildx plugin not available. Install Docker Desktop or the buildx plugin." >&2
  exit 1
}

if docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  echo "[INFO] Builder '$BUILDER_NAME' already exists."
else
  echo "[INFO] Creating builder '$BUILDER_NAME'..."
  docker buildx create --name "$BUILDER_NAME" --use
fi

echo "[INFO] Bootstrapping builder (this may pull QEMU emulators)..."
docker buildx inspect --bootstrap

echo "[OK] Builder '$BUILDER_NAME' is ready. Use: docker buildx build --platform linux/amd64,linux/arm64 ..."
