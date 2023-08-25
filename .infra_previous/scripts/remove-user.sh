#!/usr/bin/env bash
set -euo pipefail

readonly ANSIBLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../ansible"
readonly ENV_FILTER=${1:?"Merci de préciser un ou plusieurs environnements (ex. recette ou production)"}
shift

echo "Suppression du user des ressources sur l'(es) environnement(s) ${ENV_FILTER}..."
cd "${ANSIBLE_DIR}"
ansible-playbook -i env.ini --limit "${ENV_FILTER}" remove-user.yml $@
cd -
