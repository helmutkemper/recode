# Ubuntu base to keep parity across platforms (amd64/arm64)
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_VERSION=20 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# Install Node.js LTS from NodeSource + essentials for native builds
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl gnupg bash tini \
      build-essential python3 \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
         | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" \
         > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs \
    && npm i -g --unsafe-perm node-red@latest \
    && apt-get purge -y gnupg \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
# Cria apenas se não existir; não fixa UID
RUN id -u node-red >/dev/null 2>&1 || useradd -m -s /bin/bash node-red

# Workdir where Node-RED will store flows, creds, etc.
WORKDIR /data

COPY package.json /opt/defaults/package.json
COPY flows.json   /opt/defaults/flows.json
COPY settings.js  /opt/defaults/settings.js

# Permissões
RUN chown -R node-red:node-red /opt/defaults

# Copia o entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 1880
USER node-red

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
