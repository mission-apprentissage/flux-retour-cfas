#!/usr/bin/env bash

set -euo pipefail

readonly TARGET_DB=${1:?"Merci de préciser le nom de la base de donnée cible"}
shift
readonly SEED_ARCHIVE=$(mktemp seed_archive.XXXXXXXXXX)
readonly PASSPHRASE=$(mktemp passphrase.XXXXXXXXXX)

delete_cleartext() {
  rm -f "$SEED_ARCHIVE" "$PASSPHRASE"
}

trap delete_cleartext EXIT

echo "{{ vault.SEED_GPG_PASSPHRASE }}" > "$PASSPHRASE"

chmod 600 "$PASSPHRASE"

rm -r "$SEED_ARCHIVE"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_ARCHIVE" "/opt/app/configs/mongodb/seed.gpg"
chmod 600 "$SEED_ARCHIVE"
cat "$SEED_ARCHIVE" | docker compose -f "/opt/app/docker-compose.preview-system.yml" exec -iT mongodb mongorestore --archive --nsFrom="flux-retour-cfas.*" --nsTo="$TARGET_DB.*" --drop --gzip
