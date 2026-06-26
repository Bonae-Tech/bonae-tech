.PHONY: build-all build-content build-site build-admin build-worker \
        deploy-site deploy-admin deploy-worker deploy-all \
        dev-admin-mock dev-worker test-worker setup-worker

build-content:
cd 	cd packages/content && npm ci && npm run build

build-site: build-content
	cd apps/static && npm ci && npm run build

build-admin: build-content
	cd apps/admin && npm ci && npm run build

build-worker: build-content
	cd workers/content-api && npm ci && npm run build

build-all: build-site build-admin build-worker

deploy-site: build-site
	cd apps/static && npx wrangler pages deploy dist --project-name bonae-tech

deploy-admin: build-admin
	cd apps/admin && npx wrangler pages deploy dist --project-name bonae-admin

deploy-worker: build-worker
	cd workers/content-api && npx wrangler deploy

deploy-all: deploy-worker deploy-admin

dev-admin-mock:
	npm run admin:dev:mock

dev-worker:
	cd workers/content-api && npx wrangler dev

test-worker:
	cd workers/content-api && npm test

setup-worker:
	@echo "Run GitHub Actions → Bootstrap (one-time install). See docs/workflows.md"
