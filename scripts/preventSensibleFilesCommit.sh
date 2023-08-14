#!/bin/sh

# A hook script to verify that we don't commit files that could contain sensible data or credentials like json, csv, xls(x) or .env

sensible_files_pattern="\.(csv|xls|xls(x?)|json|env)$"
exception="((package.json|custom-environment-variables.json"
exception="$exception|.vscode/settings.json"
exception="$exception|manifest.json"
exception="$exception|open-api.json"
exception="$exception|server/src/jobs/hydrate/reference/bassins_emploi_communes.json"
exception="$exception|eslintrc.json|app.json|jsconfig.json|tsconfig.json|rome.json"
exception="$exception)$|^server/tests)"
exception="$exception|ui/public/modele-import.xlsx"

if grep -q vault ".infra/ansible/roles/setup/vars/main/vault.yml"; then
  echo "Oh no! Your vault.yml is not encryted!"
  exit 1
fi

# Note: we remove deleted files from the list (name-status starting with D)
files=$(git diff --cached --name-status | grep "^[^D]" | grep -v -E "$exception" | grep -E "$sensible_files_pattern")
if [ -z "$files" ]; then
  echo "No sensible files in commit. Good job!"
  exit 0
fi

echo
echo "ERROR: Preventing commit of potentially sensible files:"
echo
echo "$files" | sed "s/^/   /"
echo
echo "Either reset those files, add them to .gitignore or remove them."
echo
echo "If you know what you are doing, please double-check that you are not commiting"
echo "any credentials, password or sensible data and run git commit again with --no-verify."
echo
exit 1
