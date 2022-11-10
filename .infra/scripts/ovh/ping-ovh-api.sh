set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MODULE_DIR="${SCRIPT_DIR}/ovh-nodejs-client"

cd "${MODULE_DIR}"
yarn --silent install
yarn --silent cli ping "$@"
cd - >/dev/null

echo "SUCCEED"
