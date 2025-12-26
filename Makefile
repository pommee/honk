.PHONY: dev-server

build: ; pnpm -C client install && pnpm -C client build

install:    ; pnpm -C client install
format:     ; npx prettier --write "client/**/*.{html,css,js,tsx}"
lint:       ; pnpm -C client lint && golangci-lint run ./internal/...
commitlint: ; pnpm -C client commitlint

dev: build   ; docker compose -f docker-compose.dev.yml up
dev-server:  ; air .
dev-website: ; pnpm -C client install && pnpm -C client dev

test: install lint commitlint
	pnpm dlx knip --directory client
