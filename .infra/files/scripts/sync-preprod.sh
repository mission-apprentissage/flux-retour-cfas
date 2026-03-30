#!/usr/bin/env bash
set -euo pipefail

sourceUri="{{ MNA_TDB_MONGODB_URI }}"
targetUri="{{ SYNC_MNA_TDB_MONGODB_URI }}"

dbName="{{ MNA_TDB_MONGODB_DB_NAME }}"
dbNameTarget="{{ SYNC_MNA_TDB_MONGODB_DB_NAME }}"

SECONDS=0
docker run -i --rm mongo:7 mongodump --ssl --uri="${sourceUri}" --db="${dbName}" --archive --authenticationDatabase=${dbName} | docker run -i --rm mongo:8 mongorestore --archive --nsInclude="${dbName}.*" --nsFrom="${dbName}.*" --nsTo="${dbNameTarget}.*" --uri="${targetUri}" --authenticationDatabase=${dbNameTarget} --drop
echo "Elapsed Time: $SECONDS seconds"
