#!/bin/sh

# A hook script to verify that we don't commit data files like json, csv or xls(x)

data_files_pattern="\.(csv|xls|xls(x?)|json)$"
exception="package.json"

files=$(git diff --cached --name-only | grep -v "$exception" | grep -E "$data_files_pattern")
if [ -z "$files" ]; then
  exit 0
fi

echo
echo "ERROR: Preventing commit of data source files:"
echo
echo "$files" | sed "s/^/   /"
echo
echo "Either reset those files, add them to .gitignore or remove them."
echo
echo "If you know what you are doing, please double-check that you are not commiting"
echo "any credentials, password or sensible data and run git commit again with --no-verify."
echo
exit 1