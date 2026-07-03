#!/bin/bash

set -e

echo "Generating crypto materials..."

cd "$(dirname "$0")/.."

rm -rf organizations

cryptogen generate \
  --config=./crypto-config.yaml \
  --output=./organizations

echo "Crypto materials generated."