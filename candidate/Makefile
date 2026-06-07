.PHONY: setup dev logs seed test test-unit test-integration run clean

setup:
	npm ci

dev:
	docker compose up -d

logs:
	docker compose logs -f

seed: setup
	npm run seed

test: setup
	npm run test

test-unit: setup
	npm run test:unit

test-integration: setup
	npm run test:integration

run: setup
	npm run run

clean:
	docker compose down -v
