#!/usr/bin/env bash
set -euo pipefail

readonly GPG_FIRSTNAME=${1:?"Merci de préciser votre prénom"}
readonly GPG_LASTNAME=${2:?"Merci de préciser votre nom"}
readonly GPG_EMAIL=${3:?"Merci de préciser votre adresse email"}
readonly GPG_FULLNAME="${GPG_FIRSTNAME} ${GPG_LASTNAME}"

# Generate GPG key with predefined values
# This command will create a master key (certification)
# and a subkey with encryption capability
gpg --quiet --gen-key --batch - <<EOM
Key-Type: 1
Key-Usage: cert
Key-Length: 4096
Subkey-Type: 1
Subkey-Usage: encrypt
Subkey-Length: 4096
Expire-Date: 0
Name-Real: "${GPG_FULLNAME}"
Name-Email: ${GPG_EMAIL}
%commit
EOM

#Extract GPG ID from the generated key
GPG_ID="$(
  gpg --quiet --export "${GPG_FULLNAME}" |
    gpg --quiet --import-options show-only --import --with-colons | grep pub | awk -F ":" '{print $5}'
)"

printf "#%s <%s>\n%s\n" "${GPG_FULLNAME}" "${GPG_EMAIL}" "${GPG_ID}"
