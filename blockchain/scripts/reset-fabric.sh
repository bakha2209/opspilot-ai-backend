#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BLOCKCHAIN_DIR}/.." && pwd)"

CHAINCODE_VERSION="${1:-1.0}"
CHAINCODE_SEQUENCE="${2:-1}"

export PATH="${BLOCKCHAIN_DIR}/bin:${PATH}"
export FABRIC_CFG_PATH="${BLOCKCHAIN_DIR}"

log() {
  echo "[Fabric Reset] $1"
}

fail() {
  echo "[Fabric Reset] ERROR: $1" >&2
  exit 1
}

cd "${PROJECT_ROOT}"

if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is not available."
fi

echo
echo "WARNING:"
echo "This operation will permanently remove:"
echo "  - Fabric containers"
echo "  - Fabric ledger volumes"
echo "  - Existing channel data"
echo "  - Generated crypto materials"
echo "  - Existing blockchain audit anchors"
echo
read -r -p "Type RESET to continue: " confirmation

if [[ "${confirmation}" != "RESET" ]]; then
  echo "Reset cancelled."
  exit 0
fi

log "Stopping Fabric network..."

docker compose \
  -f blockchain/docker-compose.fabric.yml \
  down \
  --volumes \
  --remove-orphans || true

log "Removing leftover Fabric containers..."

docker rm -f \
  orderer.opspilot.com \
  peer0.org1.opspilot.com \
  peer0.org2.opspilot.com \
  couchdb0 \
  couchdb1 \
  2>/dev/null || true

log "Removing leftover chaincode containers..."

docker ps -a \
  --format '{{.ID}} {{.Names}}' |
  awk '/dev-peer.*audit-anchor/ {print $1}' |
  xargs -r docker rm -f

log "Removing leftover chaincode images..."

docker images \
  --format '{{.Repository}}:{{.Tag}} {{.ID}}' |
  awk '/dev-peer.*audit-anchor/ {print $2}' |
  xargs -r docker image rm -f

log "Removing generated artifacts..."

rm -rf "${BLOCKCHAIN_DIR}/organizations"
rm -rf "${BLOCKCHAIN_DIR}/channel-artifacts"

mkdir -p "${BLOCKCHAIN_DIR}/organizations"
mkdir -p "${BLOCKCHAIN_DIR}/channel-artifacts"

log "Generating crypto materials..."

"${SCRIPT_DIR}/generate-crypto.sh"

log "Generating channel artifacts..."

"${SCRIPT_DIR}/generate-channel-artifacts.sh"

log "Starting Fabric..."

"${SCRIPT_DIR}/start-fabric.sh"

log "Waiting for Fabric containers..."

sleep 8

log "Creating channel..."

"${SCRIPT_DIR}/create-channel.sh"

log "Joining peers..."

"${SCRIPT_DIR}/join-channel.sh"

log "Updating anchor peers..."

"${SCRIPT_DIR}/update-anchor-peers.sh"

log "Deploying chaincode version ${CHAINCODE_VERSION}, sequence ${CHAINCODE_SEQUENCE}..."

"${SCRIPT_DIR}/deploy-chaincode.sh" \
  "${CHAINCODE_VERSION}" \
  "${CHAINCODE_SEQUENCE}"

log "Verifying network..."

"${SCRIPT_DIR}/verify-network.sh"

log "Fabric reset completed successfully."