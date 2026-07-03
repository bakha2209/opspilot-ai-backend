#!/bin/bash

set -e

echo "Stopping OpsPilot Hyperledger Fabric network..."

cd "$(dirname "$0")/.."

docker compose -f docker-compose.fabric.yml down

echo "Fabric containers stopped."