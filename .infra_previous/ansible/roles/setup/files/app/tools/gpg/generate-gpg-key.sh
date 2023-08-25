#!/usr/bin/env bash
set -euo pipefail

#Inspired by https://andidittrich.com/2020/02/gpg-encrypt-files-with-a-public-keyfile-without-using-a-global-keyring.html
readonly GPG_PUBKEY="/root/.gnupg/publickey.asc"
readonly RECIPIENTS_KEYS="{{ gpg_keys }}"

function import_recipients() {
  IFS=', ' read -r -a keys <<<"${RECIPIENTS_KEYS:-""}"

  for key in "${keys[@]}"; do
    gpg --keyserver keyserver.ubuntu.com --recv-keys "${key}"
  done
}

function generate_key() {

  if test -f "${GPG_PUBKEY}"; then
    echo "*************************"
    echo "GPG key has already been generated..."
    echo "*************************"
    exit 0
  fi

  gpg --gen-key --batch - <<EOM
Key-Type: 1
Key-Usage: cert
Key-Length: 4096
Subkey-Type: 1
Subkey-Usage: encrypt
Subkey-Length: 4096
Name-Real: mna_devops
Name-Email: misson.apprentissage.devops@gmail.com
Expire-Date: 0
%no-protection
%commit
EOM

  gpg --export "mna_devops" >"${GPG_PUBKEY}"
}

generate_key
import_recipients
