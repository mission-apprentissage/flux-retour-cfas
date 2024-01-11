#!/bin/bash
set -euo pipefail

export REPO="${1:?"Veuillez préciser le repository"}";
shift;

export COMMIT_ID="${1:?"Veuillez préciser le commit ID"}"
shift;

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "Missing SENTRY_AUTH_TOKEN";
  exit 1;
fi
if [[ -z "${SENTRY_DSN:-}" ]]; then
  echo "Missing SENTRY_DSN";
  exit 1;
fi

export SENTRY_URL=https://sentry.apprentissage.beta.gouv.fr
export SENTRY_ORG=sentry
export SENTRY_PROJECT=tdb-api

../node_modules/.bin/sentry-cli releases new "$PUBLIC_VERSION"
../node_modules/.bin/sentry-cli releases set-commits "$PUBLIC_VERSION" --commit "${REPO}@${COMMIT_ID}"
../node_modules/.bin/sentry-cli sourcemaps inject ./dist 
../node_modules/.bin/sentry-cli sourcemaps upload ./dist
../node_modules/.bin/sentry-cli releases finalize "$PUBLIC_VERSION"
