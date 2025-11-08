#!/usr/bin/env bash
# Install Docker Engine on Ubuntu (amd64/arm64).
# This script follows Docker's official repo instructions.
# Usage:
#   chmod +x scripts/install-docker-ubuntu.sh
#   sudo ./scripts/install-docker-ubuntu.sh

set -euo pipefail

echo "[INFO] Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

echo "[INFO] Adding Docker’s official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --yes --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "[INFO] Setting up repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[INFO] Installing Docker Engine + Compose..."
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "[INFO] Adding current user to docker group (you may need to re-login)..."
sudo usermod -aG docker "$USER" || true

echo "[OK] Docker installed. Verify with: docker version && docker compose version"
