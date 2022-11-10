#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ANSIBLE_DIR="${SCRIPT_DIR}/../../ansible"
readonly VAULT_FILE="${1:-${ANSIBLE_DIR}/roles/setup/vars/main/vault.yml}"

ansible-vault encrypt --vault-password-file="${SCRIPT_DIR}/get-vault-password-client.sh" "${VAULT_FILE}"
