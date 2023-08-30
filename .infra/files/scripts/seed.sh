#!/usr/bin/env bash

set -euo pipefail

readonly TARGET_DB="{{ vault[env_type].MNA_TDB_MONGODB_URI }}"
readonly SEED_ARCHIVE=$(mktemp seed_archive.XXXXXXXXXX)

delete_cleartext() {
  rm -f "$SEED_GZ" "$PASSPHRASE_FILE"
}

trap delete_cleartext EXIT

chmod 600 "$PASSPHRASE"
chmod 600 "$SEED_ARCHIVE"

echo "{{ vault.SEED_GPG_PASSPHRASE }}" > "$PASSPHRASE"
gpg -d --batch --passphrase-file "$PASSPHRASE" -o "$SEED_ARCHIVE" "/opt/app/configs/mongodb/seed.gpg"
cat "$SEED_GZ" | docker compose -f "$ROOT_DIR/docker-compose.yml" exec -iT mongodb mongorestore --archive --nsInclude="flux-retour-cfas.*" --uri="${TARGET_DB}" --drop --gzip
