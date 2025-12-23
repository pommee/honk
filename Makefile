.PHONY: dev-server

build: ; pnpm -C client install && pnpm -C client build

dev: build   ; docker compose -f docker-compose.dev.yml up
dev-server:  ; air .
dev-website: ; pnpm -C client install && pnpm -C client dev
