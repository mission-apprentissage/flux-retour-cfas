#!/usr/bin/env bash

set -euo pipefail

function Help() {
   # Display Help
   echo "Commands"
   echo "  bin:setup                                  Installs mna-tdb binary with zsh completion on system"
   echo "  init:env                                   Update local env files using values from vault file"
   echo "  release:interactive                        Build & Push Docker image releases"
   echo "  release:app                                Build & Push Docker image releases"
   echo "  deploy <env> --user <your_username>        Deploy application to <env>"
   echo "  preview:build                              Build preview"
   echo "  preview:cleanup --user <your_username>     Remove preview from close pull-requests"
   echo "  vault:edit                                 Edit vault file"
   echo "  vault:password                             Show vault password"
   echo "  preprod:sync                               Sync preprod database with production"
   echo "  seed:update                                Update seed using a database"
   echo "  seed:apply                                 Apply seed to a database"
   echo "  deploy:log:encrypt                         Encrypt Github ansible logs"
   echo "  deploy:log:dencrypt                        Decrypt Github ansible logs"
   echo "  sentry:release                             Create sentry release for existing docker image"
   echo "  sentry:deploy                              Notify deployment to sentry for existing sentry release"
   echo
   echo
}

function bin:setup() {
  sudo ln -fs "${ROOT_DIR}/.bin/mna-tdb" /usr/local/bin/mna-tdb

  sudo mkdir -p /usr/local/share/zsh/site-functions
  sudo ln -fs "${ROOT_DIR}/.bin/zsh-completion" /usr/local/share/zsh/site-functions/_mna-tdb
  sudo rm -f ~/.zcompdump*
}

function init:env() {
  "${SCRIPT_DIR}/setup-local-env.sh" "$@"
}

function release:interactive() {
  "${SCRIPT_DIR}/release-interactive.sh" "$@"
}

function release:app() {
  "${SCRIPT_DIR}/release-app.sh" "$@"
}

function build:image() {
  "${SCRIPT_DIR}/build-images.sh" "$@"
}

function docker:login() {
  "${SCRIPT_DIR}/docker-login.sh" "$@"
}

function sentry:release() {
  "${SCRIPT_DIR}/sentry-release.sh" "$@"
}

function sentry:deploy() {
  "${SCRIPT_DIR}/sentry-deploy.sh" "$@"
}

function deploy() {
  "${SCRIPT_DIR}/deploy-app.sh" "$@"
}

function preview:build() {
  "${SCRIPT_DIR}/build-images.sh" "$@"
}

function preview:cleanup() {
  "${SCRIPT_DIR}/run-playbook.sh" "preview_cleanup.yml" "preview"
}

function preprod:sync() {
  "${SCRIPT_DIR}/run-playbook.sh" "sync-preprod.yml" "production"
}

function vault:init() {
  # Ensure Op is connected
  op --account mission-apprentissage account account get > /dev/null
  op --account mission-apprentissage account document get ".vault-password-tmpl" --vault "mna-vault-passwords-common" > "${ROOT_DIR}/.infra/vault/.vault-password.gpg"
}

function vault:edit() {
  editor=${EDITOR:-'code -w'}
  EDITOR=$editor "${SCRIPT_DIR}/edit-vault.sh" "$@"
}

function vault:password() {
  "${SCRIPT_DIR}/get-vault-password-client.sh" "$@"
}

function seed:update() {
  "${SCRIPT_DIR}/seed-update.sh" "$@"
}

function seed:apply() {
  "${SCRIPT_DIR}/seed-apply.sh" "$@"
}

function deploy:log:encrypt() {
  (cd "$ROOT_DIR" && "${SCRIPT_DIR}/deploy-log-encrypt.sh" "$@")
}

function deploy:log:decrypt() {
  (cd "$ROOT_DIR" && "${SCRIPT_DIR}/deploy-log-decrypt.sh" "$@")
}
