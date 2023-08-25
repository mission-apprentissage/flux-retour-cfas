#!/usr/bin/env bash
set -euo pipefail

gpg --decrypt --default-key "mna_devops" $@
