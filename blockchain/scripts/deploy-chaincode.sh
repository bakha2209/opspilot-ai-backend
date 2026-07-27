#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BLOCKCHAIN_DIR}/.." && pwd)"

export PATH="${BLOCKCHAIN_DIR}/bin:${PATH}"
export FABRIC_CFG_PATH="${BLOCKCHAIN_DIR}"

CHANNEL_NAME="${CHANNEL_NAME:-audit-channel}"
CHAINCODE_NAME="${CHAINCODE_NAME:-audit-anchor}"
CHAINCODE_VERSION="${1:-1.1}"
CHAINCODE_SEQUENCE="${2:-2}"
CHAINCODE_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"
CHAINCODE_PATH="${BLOCKCHAIN_DIR}/chaincode/audit-anchor"
CHAINCODE_PACKAGE="${BLOCKCHAIN_DIR}/chaincode/${CHAINCODE_LABEL}.tar.gz"

ORDERER_CA="${BLOCKCHAIN_DIR}/organizations/ordererOrganizations/opspilot.com/orderers/orderer.opspilot.com/msp/tlscacerts/tlsca.opspilot.com-cert.pem"

ORG1_TLS_CERT="${BLOCKCHAIN_DIR}/organizations/peerOrganizations/org1.opspilot.com/peers/peer0.org1.opspilot.com/tls/ca.crt"
ORG2_TLS_CERT="${BLOCKCHAIN_DIR}/organizations/peerOrganizations/org2.opspilot.com/peers/peer0.org2.opspilot.com/tls/ca.crt"

log() {
  echo "[Chaincode Deploy] $1"
}

log "Packaging ${CHAINCODE_NAME} version ${CHAINCODE_VERSION}..."

rm -f "${CHAINCODE_PACKAGE}"

peer lifecycle chaincode package "${CHAINCODE_PACKAGE}" \
  --path "${CHAINCODE_PATH}" \
  --lang node \
  --label "${CHAINCODE_LABEL}"

log "Installing on Org1..."

cd "${PROJECT_ROOT}"
source blockchain/scripts/env-org1.sh

peer lifecycle chaincode install "${CHAINCODE_PACKAGE}" || true

log "Installing on Org2..."

source blockchain/scripts/env-org2.sh

peer lifecycle chaincode install "${CHAINCODE_PACKAGE}" || true

log "Finding package ID..."

source blockchain/scripts/env-org1.sh

PACKAGE_ID="$(
  peer lifecycle chaincode queryinstalled |
  awk -v label="${CHAINCODE_LABEL}" '
    $0 ~ "Label: " label {
      gsub("Package ID: ", "", $1)
      gsub(",", "", $1)
      print $1
    }
  '
)"

if [[ -z "${PACKAGE_ID}" ]]; then
  echo "[Chaincode Deploy] ERROR: Package ID not found for ${CHAINCODE_LABEL}" >&2
  exit 1
fi

log "Package ID: ${PACKAGE_ID}"

log "Approving for Org1..."

source blockchain/scripts/env-org1.sh

peer lifecycle chaincode approveformyorg \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  --channelID "${CHANNEL_NAME}" \
  --name "${CHAINCODE_NAME}" \
  --version "${CHAINCODE_VERSION}" \
  --package-id "${PACKAGE_ID}" \
  --sequence "${CHAINCODE_SEQUENCE}" \
  --tls \
  --cafile "${ORDERER_CA}"

log "Approving for Org2..."

source blockchain/scripts/env-org2.sh

peer lifecycle chaincode approveformyorg \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  --channelID "${CHANNEL_NAME}" \
  --name "${CHAINCODE_NAME}" \
  --version "${CHAINCODE_VERSION}" \
  --package-id "${PACKAGE_ID}" \
  --sequence "${CHAINCODE_SEQUENCE}" \
  --tls \
  --cafile "${ORDERER_CA}"

log "Checking commit readiness..."

source blockchain/scripts/env-org1.sh

peer lifecycle chaincode checkcommitreadiness \
  --channelID "${CHANNEL_NAME}" \
  --name "${CHAINCODE_NAME}" \
  --version "${CHAINCODE_VERSION}" \
  --sequence "${CHAINCODE_SEQUENCE}" \
  --output json

log "Committing chaincode..."

unset CORE_PEER_TLS_SERVERHOSTOVERRIDE || true

peer lifecycle chaincode commit \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  --channelID "${CHANNEL_NAME}" \
  --name "${CHAINCODE_NAME}" \
  --version "${CHAINCODE_VERSION}" \
  --sequence "${CHAINCODE_SEQUENCE}" \
  --tls \
  --cafile "${ORDERER_CA}" \
  --peerAddresses peer0.org1.opspilot.com:7051 \
  --tlsRootCertFiles "${ORG1_TLS_CERT}" \
  --peerAddresses peer0.org2.opspilot.com:9051 \
  --tlsRootCertFiles "${ORG2_TLS_CERT}"

log "Verifying committed definition..."

source blockchain/scripts/env-org1.sh

peer lifecycle chaincode querycommitted \
  --channelID "${CHANNEL_NAME}" \
  --name "${CHAINCODE_NAME}"

log "Chaincode deployment completed successfully."