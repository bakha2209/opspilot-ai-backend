#!/usr/bin/env bash

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BLOCKCHAIN_DIR}/.." && pwd)"

export PATH="${BLOCKCHAIN_DIR}/bin:${PATH}"
export FABRIC_CFG_PATH="${BLOCKCHAIN_DIR}"

CHANNEL_NAME="${CHANNEL_NAME:-audit-channel}"
CHAINCODE_NAME="${CHAINCODE_NAME:-audit-anchor}"

PASSED=0
FAILED=0

success() {
  printf "✔ %-35s OK\n" "$1"
  PASSED=$((PASSED + 1))
}

failure() {
  printf "✘ %-35s FAILED\n" "$1"
  FAILED=$((FAILED + 1))
}

check_command() {
  local name="$1"
  local command_name="$2"

  if command -v "${command_name}" >/dev/null 2>&1; then
    success "${name}"
  else
    failure "${name}"
  fi
}

check_container() {
  local display_name="$1"
  local container_name="$2"

  if docker inspect \
    --format '{{.State.Running}}' \
    "${container_name}" 2>/dev/null | grep -q true; then
    success "${display_name}"
  else
    failure "${display_name}"
  fi
}

echo
echo "=========================================="
echo " OpsPilot Fabric Network Verification"
echo "=========================================="
echo

check_command "Docker CLI" docker
check_command "Fabric peer CLI" peer
check_command "cryptogen" cryptogen
check_command "configtxgen" configtxgen

if docker info >/dev/null 2>&1; then
  success "Docker daemon"
else
  failure "Docker daemon"
fi

if docker network inspect opspilot-fabric-network >/dev/null 2>&1; then
  success "Fabric Docker network"
else
  failure "Fabric Docker network"
fi

check_container "Orderer" "orderer.opspilot.com"
check_container "Org1 peer" "peer0.org1.opspilot.com"
check_container "Org2 peer" "peer0.org2.opspilot.com"
check_container "Org1 CouchDB" "couchdb0"
check_container "Org2 CouchDB" "couchdb1"

cd "${PROJECT_ROOT}"

if getent hosts orderer.opspilot.com >/dev/null 2>&1; then
  success "Orderer hostname resolution"
else
  failure "Orderer hostname resolution"
fi

if getent hosts peer0.org1.opspilot.com >/dev/null 2>&1; then
  success "Org1 hostname resolution"
else
  failure "Org1 hostname resolution"
fi

if getent hosts peer0.org2.opspilot.com >/dev/null 2>&1; then
  success "Org2 hostname resolution"
else
  failure "Org2 hostname resolution"
fi

if [[ -f "${BLOCKCHAIN_DIR}/channel-artifacts/${CHANNEL_NAME}.block" ]]; then
  success "Channel block artifact"
else
  failure "Channel block artifact"
fi

if source blockchain/scripts/env-org1.sh 2>/dev/null &&
  peer channel list 2>/dev/null |
    grep -q "${CHANNEL_NAME}"; then
  success "Org1 joined ${CHANNEL_NAME}"
else
  failure "Org1 joined ${CHANNEL_NAME}"
fi

if source blockchain/scripts/env-org2.sh 2>/dev/null &&
  peer channel list 2>/dev/null |
    grep -q "${CHANNEL_NAME}"; then
  success "Org2 joined ${CHANNEL_NAME}"
else
  failure "Org2 joined ${CHANNEL_NAME}"
fi

if source blockchain/scripts/env-org1.sh 2>/dev/null &&
  peer lifecycle chaincode querycommitted \
    --channelID "${CHANNEL_NAME}" \
    --name "${CHAINCODE_NAME}" \
    >/dev/null 2>&1; then
  success "Chaincode ${CHAINCODE_NAME}"
else
  failure "Chaincode ${CHAINCODE_NAME}"
fi

echo
echo "------------------------------------------"
echo "Passed: ${PASSED}"
echo "Failed: ${FAILED}"
echo "------------------------------------------"

if [[ "${FAILED}" -gt 0 ]]; then
  echo "Fabric network verification failed."
  exit 1
fi

echo "Fabric network is healthy."