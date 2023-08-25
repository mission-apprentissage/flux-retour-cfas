#!/usr/bin/env bash
set -euo pipefail
#Needs to be run as sudo

readonly IP=${1:?"Please provide an IP address"}
shift

fail2ban-client set "sshd" unbanip "${IP}"
fail2ban-client set "nginx-conn-limit" unbanip "${IP}"
fail2ban-client set "nginx-req-limit" unbanip "${IP}"
