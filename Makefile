# Project: recode
# Simple targets to build/run Node-RED in Ubuntu-based container
# Cross-platform aware (amd64/arm64) via Docker Buildx

SHELL := /bin/bash
APP_NAME := recode-node-red
COMPOSE ?= docker compose
PLATFORMS ?= linux/amd64,linux/arm64
IMAGE ?= recode/node-red:local
ENV_FILE ?= .env

.PHONY: help
help:
	@echo "Targets:"
	@echo "  init         - create .env with defaults (if missing)"
	@echo "  build        - build image (native arch)"
	@echo "  buildx       - multi-arch build with buildx (no push)"
	@echo "  up           - start stack"
	@echo "  down         - stop stack"
	@echo "  logs         - follow logs"
	@echo "  shell        - bash into running container"
	@echo "  reset-data   - remove persisted Node-RED data (CAUTION)"
	@echo "  clean        - remove dangling images"

.PHONY: init
init:
	@if [ ! -f $(ENV_FILE) ]; then \
	  echo 'TZ=America/Sao_Paulo' > $(ENV_FILE); \
	  echo 'NODE_RED_PORT=1880'   >> $(ENV_FILE); \
	  echo 'NODE_RED_FLOWS=flows.json' >> $(ENV_FILE); \
	  echo 'Created $(ENV_FILE)'; \
	else echo "$(ENV_FILE) already exists"; fi

.PHONY: build
build: init
	$(COMPOSE) build

.PHONY: buildx
buildx: init
	@echo ">>> Ensure buildx is enabled (scripts/enable-buildx.sh) if this fails"
	docker buildx build \
	  --platform $(PLATFORMS) \
	  -t $(IMAGE) \
	  -f node-red/Dockerfile node-red

.PHONY: up
up: init
	$(COMPOSE) up -d

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: logs
logs:
	$(COMPOSE) logs -f

.PHONY: shell
shell:
	@cid=$$($(COMPOSE) ps -q node-red); \
	if [ -z "$$cid" ]; then echo "node-red not running"; exit 1; fi; \
	docker exec -it $$cid bash

.PHONY: reset-data
reset-data:
	#@read -p "This will DELETE node-red/data/* . Continue? [y/N] " a; \
	#if [[ "$$a" == "y" || "$$a" == "Y" ]]; then rm -rf node-red/data && mkdir -p node-red/data; fi
	rm -rf node-red/data && mkdir -p node-red/data;

.PHONY: clean
clean:
	docker image prune -f

.PHONY: factory-reset
factory-reset:
	rm -rf node-red/node_modules node-red/package-lock.json

.PHONY: update-nodes
update-nodes:
	#npm i --prefix /Users/kemper/go/kemper/recode/node-red/data @shoelace-style/shoelace
	$(MAKEFILE) make down
	$(MAKEFILE) make reset-data
	$(MAKEFILE) make factory-reset
	$(MAKEFILE) make build
	$(MAKEFILE) make up

.PHONY: pre-commit
pre-commit:
	$(MAKEFILE) make down
	$(MAKEFILE) make reset-data
	$(MAKEFILE) make factory-reset
