#!/bin/bash
set -euo pipefail

export REPO="${1:?"Veuillez préciser le repository"}";
shift;
export VERSION="${1:?"Veuillez préciser la version"}";
shift;

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "Missing SENTRY_AUTH_TOKEN";
  exit 1;
fi
if [[ -z "${SENTRY_DSN:-}" ]]; then
  echo "Missing SENTRY_DSN";
  exit 1;
fi
if [[ -z "${SENTRY_PROJECT:-}" ]]; then
  echo "Missing SENTRY_PROJECT";
  exit 1;
fi

export SENTRY_URL=https://sentry.apprentissage.beta.gouv.fr
export SENTRY_ORG=sentry

yarn sentry-cli releases new "$VERSION"
yarn sentry-cli releases set-commits "$VERSION" --commit "${REPO}@${COMMIT_ID}"
yarn sentry-cli sourcemaps inject ./dist 
yarn sentry-cli sourcemaps upload ./dist
yarn sentry-cli releases finalize "$VERSION"

yarn sentry-cli releases deploys "$VERSION" new -e ENVIRONMENT -t $DURATION
