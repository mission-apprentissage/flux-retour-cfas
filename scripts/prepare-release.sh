#!/bin/sh

next_version="${1}"

cd ./ui
npm version ${next_version}
cd ../server
npm version ${next_version}