# Agent Portal Frontend - Docker Management
# ==============================================

# Default variables
DOCKER_IMAGE_NAME := planettalk/agent-portal-frontend
DOCKER_TAG := latest
COMPOSE_FILE := docker-compose.yml
ENV_FILE := .env

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help build build-dev build-prod up up-dev up-prod down down-dev down-prod logs restart clean prune health status deploy deploy-dev deploy-prod backup restore

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(BLUE)Agent Portal Frontend - Docker Management$(NC)"
	@echo "=================================================="
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Environment Variables:$(NC)"
	@echo "  DOCKER_IMAGE_NAME: $(DOCKER_IMAGE_NAME)"
	@echo "  DOCKER_TAG: $(DOCKER_TAG)"
	@echo "  COMPOSE_FILE: $(COMPOSE_FILE)"
	@echo "  ENV_FILE: $(ENV_FILE)"

# Build Commands
# ==============

build: build-prod ## Build production Docker image

build-dev: ## Build development Docker image
	@echo "$(BLUE)Building development image...$(NC)"
	docker build --target development -t $(DOCKER_IMAGE_NAME):dev .
	@echo "$(GREEN)Development image built successfully!$(NC)"

build-prod: ## Build production Docker image
	@echo "$(BLUE)Building production image...$(NC)"
	docker build --target production -t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) .
	@echo "$(GREEN)Production image built successfully!$(NC)"

build-all: build-dev build-prod ## Build both development and production images

# Development Commands
# ===================

dev-up: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose --profile dev up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "$(YELLOW)Frontend available at: http://localhost:3000$(NC)"

dev-down: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	docker-compose --profile dev down
	@echo "$(GREEN)Development environment stopped!$(NC)"

dev-restart: dev-down dev-up ## Restart development environment

dev-logs: ## Show development logs
	docker-compose --profile dev logs -f

dev-ps: ## Show development service status
	@echo "$(BLUE)Development Services Status:$(NC)"
	docker-compose --profile dev ps

dev-shell: ## Get shell access to development container
	docker-compose exec agent-frontend-dev sh

dev-build: ## Build development image
	@echo "$(BLUE)Building development image...$(NC)"
	docker build --target development -t $(DOCKER_IMAGE_NAME):dev .
	@echo "$(GREEN)Development image built successfully!$(NC)"

dev-deploy: dev-build dev-down dev-up ## Build and deploy development environment
	@echo "$(GREEN)Development deployment completed!$(NC)"

# Production Commands
# ==================

prod-up: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose --profile prod up -d
	@echo "$(GREEN)Production environment started!$(NC)"
	@echo "$(YELLOW)Frontend available at: https://portal.planettalk.com$(NC)"

prod-down: ## Stop production environment
	@echo "$(BLUE)Stopping production environment...$(NC)"
	docker-compose --profile prod down
	@echo "$(GREEN)Production environment stopped!$(NC)"

prod-restart: prod-down prod-up ## Restart production environment

prod-logs: ## Show production logs
	docker-compose --profile prod logs -f

prod-ps: ## Show production service status
	@echo "$(BLUE)Production Services Status:$(NC)"
	docker-compose --profile prod ps

prod-shell: ## Get shell access to production container
	docker-compose exec agent-frontend-prod sh

prod-build: ## Build production image
	@echo "$(BLUE)Building production image...$(NC)"
	docker build --target production -t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) .
	@echo "$(GREEN)Production image built successfully!$(NC)"

prod-deploy: prod-build prod-down prod-up ## Build and deploy production environment
	@echo "$(GREEN)Production deployment completed!$(NC)"

# Management Commands
# ==================

up: dev-up ## Start default (development) environment

down: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)All services stopped!$(NC)"

restart: down up ## Restart all services

# Legacy aliases for backwards compatibility
up-dev: dev-up ## Alias for dev-up
up-prod: prod-up ## Alias for prod-up
down-dev: dev-down ## Alias for dev-down
down-prod: prod-down ## Alias for prod-down
restart-dev: dev-restart ## Alias for dev-restart
restart-prod: prod-restart ## Alias for prod-restart

# Monitoring Commands
# ==================

logs: dev-logs ## Show logs for default (development) services

ps: dev-ps ## Show status of default (development) services

status: ## Show status of all services
	@echo "$(BLUE)All Services Status:$(NC)"
	docker-compose ps

health: ## Check health of running containers
	@echo "$(BLUE)Container Health Status:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(agent-frontend)" || echo "No agent portal containers running"

# Development Utilities
# =====================

shell: dev-shell ## Get shell access to development container

npm-install: ## Install npm dependencies in development container
	docker-compose exec agent-frontend-dev npm install

npm-update: ## Update npm dependencies in development container
	docker-compose exec agent-frontend-dev npm update

lint: ## Run linting in development container
	docker-compose exec agent-frontend-dev npm run lint

type-check: ## Run TypeScript type checking
	docker-compose exec agent-frontend-dev npm run type-check

# Cleanup Commands
# ===============

clean: ## Remove stopped containers and unused images
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	docker container prune -f
	docker image prune -f
	@echo "$(GREEN)Cleanup completed!$(NC)"

clean-all: ## Remove all containers, images, and volumes (DESTRUCTIVE)
	@echo "$(RED)WARNING: This will remove ALL Docker resources!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 5 seconds to continue...$(NC)"
	@sleep 5
	docker-compose down -v
	docker system prune -af --volumes
	@echo "$(GREEN)Complete cleanup finished!$(NC)"

prune: clean ## Alias for clean

# Image Management
# ===============

pull: ## Pull latest base images
	@echo "$(BLUE)Pulling latest base images...$(NC)"
	docker pull node:18-alpine
	@echo "$(GREEN)Base images updated!$(NC)"

push: ## Push images to registry
	@echo "$(BLUE)Pushing images to registry...$(NC)"
	docker push $(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	docker push $(DOCKER_IMAGE_NAME):dev
	@echo "$(GREEN)Images pushed successfully!$(NC)"

tag: ## Tag current image with latest
	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) $(DOCKER_IMAGE_NAME):latest

# Environment Management
# ======================

env-example: ## Create example environment file
	@if [ ! -f .env.example ]; then \
		echo "$(BLUE)Creating .env.example file...$(NC)"; \
		echo "# Agent Portal Frontend Environment Variables" > .env.example; \
		echo "# Copy this file to .env and update the values" >> .env.example; \
		echo "" >> .env.example; \
		echo "# Application URLs" >> .env.example; \
		echo "NEXT_PUBLIC_API_URL=https://api.planettalk.com" >> .env.example; \
		echo "NEXT_PUBLIC_APP_URL=https://agents.planettalk.com" >> .env.example; \
		echo "" >> .env.example; \
		echo "# Development URLs (uncomment for local development)" >> .env.example; \
		echo "# NEXT_PUBLIC_API_URL=http://localhost:3001" >> .env.example; \
		echo "# NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env.example; \
		echo "$(GREEN).env.example created!$(NC)"; \
	else \
		echo "$(YELLOW).env.example already exists!$(NC)"; \
	fi

env-check: ## Check if .env file exists
	@if [ -f .env ]; then \
		echo "$(GREEN).env file exists$(NC)"; \
	else \
		echo "$(RED).env file not found!$(NC)"; \
		echo "$(YELLOW)Run 'make env-example' to create a template$(NC)"; \
	fi

# Deployment Commands
# ==================

deploy: dev-deploy ## Deploy to default (development) environment

deploy-staging: prod-build ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging environment...$(NC)"
	@make prod-down
	DOCKER_TAG=staging make prod-up
	@echo "$(GREEN)Staging deployment completed!$(NC)"

deploy-production: ## Deploy to production environment (requires confirmation)
	@echo "$(RED)WARNING: This will deploy to PRODUCTION!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to cancel, or wait 10 seconds to continue...$(NC)"
	@sleep 10
	@echo "$(BLUE)Deploying to production environment...$(NC)"
	@make prod-deploy
	@echo "$(GREEN)Production deployment completed!$(NC)"

# Backup and Restore (for volumes if needed in the future)
# ========================================================

backup: ## Create backup of application data
	@echo "$(BLUE)Creating backup...$(NC)"
	@mkdir -p backups
	@docker run --rm -v agent-portal-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/agent-portal-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "$(GREEN)Backup created in backups/ directory$(NC)"

restore: ## Restore from backup (specify BACKUP_FILE)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: Please specify BACKUP_FILE=filename$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restoring from $(BACKUP_FILE)...$(NC)"
	@docker run --rm -v agent-portal-data:/data -v $(PWD)/backups:/backup alpine tar xzf /backup/$(BACKUP_FILE) -C /data
	@echo "$(GREEN)Restore completed!$(NC)"

# Quick Start Commands
# ===================

first-run: env-example dev-build dev-up ## First time setup and run
	@echo "$(GREEN)First run completed!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Copy .env.example to .env and update values"
	@echo "2. Visit http://localhost:3000"

# Docker Info
# ===========

info: ## Show Docker system information
	@echo "$(BLUE)Docker System Information:$(NC)"
	@docker system df
	@echo ""
	@echo "$(BLUE)Running Containers:$(NC)"
	@docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(BLUE)Available Images:$(NC)"
	@docker images | grep -E "(agent-portal|planettalk)" || echo "No agent portal images found"
