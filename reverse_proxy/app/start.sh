#!/usr/bin/env bash
set -euo pipefail

mkdir -p /data
touch /data/error.log
touch /data/access.log

nginx && tail -f /data/*.log
