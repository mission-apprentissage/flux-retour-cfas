install: install-root install-server install-ui
build: build-server build-ui

install-root:
	yarn install

install-server:
	yarn --cwd server install --frozen-lockfile

install-ui:
	yarn --cwd ui install --frozen-lockfile

build-ui: 
	yarn --cwd ui build

build-server: 
	yarn --cwd server build

start:
	docker-compose up --build --force-recreate -d

stop:
	docker-compose stop

test:
	yarn --cwd server test

coverage:
	yarn --cwd server test:coverage

lint:
	yarn lint

clean:
	docker-compose down

ci: install lint test build
