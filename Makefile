.PHONY: help install build dev typecheck clean run \
        docker-build docker-dev docker-dev-sh docker-ci docker-prod docker-clean \
        release-patch release-minor release-major

help:
	@echo "Available targets:"
	@echo ""
	@echo "  Local"
	@echo "  install         - Install dependencies"
	@echo "  build           - Build the project"
	@echo "  dev             - Build in watch mode"
	@echo "  typecheck       - Run TypeScript type checking"
	@echo "  run             - Run the CLI locally"
	@echo "  clean           - Remove build artifacts"
	@echo ""
	@echo "  Docker"
	@echo "  docker-build    - Build all Docker images (dev, ci, prod)"
	@echo "  docker-dev      - Start dev container in watch mode"
	@echo "  docker-dev-sh   - Open a shell in the running dev container"
	@echo "  docker-ci       - Run lint + tests in CI container"
	@echo "  docker-clean    - Remove all crawler containers and images"
	@echo ""
	@echo "  Release"
	@echo "  release-patch   - Bump patch version and push tag"
	@echo "  release-minor   - Bump minor version and push tag"
	@echo "  release-major   - Bump major version and push tag"

# ─── Local ────────────────────────────────────────────────────────────────────

install:
	npm install

build:
	npm run build

dev:
	npm run dev

typecheck:
	npm run typecheck

clean:
	rm -rf dist node_modules

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-build:
	docker compose build

docker-dev:
	docker compose --profile dev up crawler-dev

docker-dev-sh:
	docker exec -it crawler-dev sh

docker-ci:
	docker compose --profile ci run --rm crawler-ci

docker-clean:
	docker compose --profile dev --profile ci --profile prod down --rmi all
	docker image prune -f

# ─── Release ──────────────────────────────────────────────────────────────────

release-patch:
	npm version patch
	git push --follow-tags

release-minor:
	npm version minor
	git push --follow-tags

release-major:
	npm version major
	git push --follow-tags
