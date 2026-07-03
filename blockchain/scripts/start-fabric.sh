#!/bin/bash

set -e

echo "Starting OpsPilot Hyperledger Fabric network..."

cd "$(dirname "$0")/.."

docker compose -f docker-compose.fabric.yml up -d

echo "Fabric containers started."
echo ""
echo "Check containers:"
echo "docker ps --filter name=opspilot --filter name=peer --filter name=orderer"