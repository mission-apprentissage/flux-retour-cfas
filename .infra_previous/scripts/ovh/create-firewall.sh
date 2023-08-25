set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MODULE_DIR="${SCRIPT_DIR}/ovh-nodejs-client"
readonly ANSIBLE_DIR="${SCRIPT_DIR}/../../ansible"
readonly ENV_NAME=${1:?"Merci de préciser un environnement (ex. recette ou production)"}
shift

function main() {
  local env_ip
  env_ip="$(grep "\[${ENV_NAME}\]" -A 1 "${ANSIBLE_DIR}/env.ini" | tail -1)"

  cd "${MODULE_DIR}"
  yarn --silent install
  yarn --silent cli createFirewall "${env_ip}" "$@"
  cd - >/dev/null
}

main "$@"
