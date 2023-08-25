#!/usr/bin/env bash
set -euo pipefail

readonly ANSIBLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../ansible"

function open_ssh_tunnel() {
  local env_name="${1:?"Please provide an environment name (eg. recette)"}"
  local local_port="${2:-"27017"}"
  local remote_user="${3:-$(whoami)}"
  local env_ip
  env_ip="$(cat "${ANSIBLE_DIR}/env.ini" | grep "\[${env_name}\]" -A 1 | tail -1)"

  echo "mongodb://{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_USER }}:{{ vault[env_type].FLUX_RETOUR_CFAS_MONGODB_USER_PASSWORD }}@127.0.0.1:${local_port}/{{ vault.DB_NAME }}?authSource=admin&retryWrites=true&w=majority"
  ssh -L "${local_port}:127.0.0.1:27017" "${remote_user}@${env_ip}"
}

open_ssh_tunnel "$@"
