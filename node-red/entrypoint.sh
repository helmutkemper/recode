#!/usr/bin/env bash
set -euo pipefail

# Seed /data with defaults if missing
if [ ! -f /data/settings.js ]; then
  mkdir -p /data
  cp -n /opt/defaults/* /data/ || true
fi

exec node-red -u /data --settings /data/settings.js --flowFile /data/flows.json
