# Makefile for TBA Classifier
.PHONY: help install dev build down logs test clean

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands (like npm scripts)
install: ## Install Python dependencies locally (auto-detects macOS vs Linux)
ifeq ($(shell uname),Darwin)
	python3 -m venv .venv && .venv/bin/pip install -r requirements-local.txt
else
	python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
endif

dev: ## Run development server locally with hot-reload (requires install first)
	FLASK_DEBUG=1 .venv/bin/python3 main.py

# Docker commands
build: ## Build Docker image
	docker-compose build

dev-up: ## Start development services with live reload (Docker)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

test: ## Test the /model/score endpoint using test dataset (requires server to be running)
	@echo "Testing batch classification..."
	jq '{data: .}' data/test-dataset.json | curl -X POST http://localhost:8000/contact/score -H 'Content-Type: application/json' -d @-
	jq '{data: .}' data/test-dataset.json | curl -X POST http://localhost:8000/whatsapp/score -H 'Content-Type: application/json' -d @-

health: ## Check API health
	curl -f http://localhost:8000/ || echo "Service not available"

version: ## Get API version
	curl -s http://localhost:8000/contact/version
	curl -s http://localhost:8000/whatsapp/version

clean: ## Clean up containers and volumes
	docker-compose down -v
	docker system prune -f

# Docker build commands (similar to existing workflow)
build-prod: ## Build production image
	docker buildx build --platform linux/amd64 -t tba-classifier .

run-prod: ## Run production container
	docker run --rm -it -p 8000:8000 --name classifier tba-classifier
