#!/bin/sh

# A hook script to verify that we don't force push on master / main / develop branch

BRANCH=`git rev-parse --abbrev-ref HEAD`
PUSH_COMMAND=`ps -ocommand= -p $PPID`

if [[ "$BRANCH" =~ ^(master|main|develop)$ && "$PUSH_COMMAND" =~ force|delete|-f ]]; then
  echo
  echo "Prevented force-push to $BRANCH. This is a very dangerous command."
  echo "If you really want to do this, use --no-verify to bypass this pre-push hook."
  echo
  exit 1
fi

exit 0