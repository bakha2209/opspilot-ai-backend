#!/usr/bin/env bash

set -Eeuo pipefail

FABRIC_VERSION="${FABRIC_VERSION:-2.5.14}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.12}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BLOCKCHAIN_DIR}/.." && pwd)"

log() {
  echo "[Fabric Setup] $1"
}

fail() {
  echo "[Fabric Setup] ERROR: $1" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

log "Checking operating system..."

if [[ "$(uname -s)" != "Linux" ]]; then
  fail "This script must run on Linux or WSL Ubuntu."
fi

log "Checking required commands..."

command_exists curl || fail "curl is not installed."
command_exists tar || fail "tar is not installed."
command_exists docker || fail "Docker CLI is not installed."
docker compose version >/dev/null 2>&1 ||
  fail "Docker Compose plugin is not installed."

log "Checking Docker daemon..."

docker info >/dev/null 2>&1 ||
  fail "Docker daemon is not running or the current user cannot access it."

log "Preparing Fabric directories..."

mkdir -p "${BLOCKCHAIN_DIR}/bin"
mkdir -p "${BLOCKCHAIN_DIR}/config"

if [[ -x "${BLOCKCHAIN_DIR}/bin/peer" ]] &&
   [[ -x "${BLOCKCHAIN_DIR}/bin/cryptogen" ]] &&
   [[ -x "${BLOCKCHAIN_DIR}/bin/configtxgen" ]]; then
  log "Fabric binaries already exist. Skipping binary download."
else
  log "Downloading Hyperledger Fabric binaries..."

  TEMP_DIR="$(mktemp -d)"
  trap 'rm -rf "${TEMP_DIR}"' EXIT

  curl -fsSL \
    "https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-linux-amd64-${FABRIC_VERSION}.tar.gz" \
    -o "${TEMP_DIR}/fabric.tar.gz"

  tar -xzf "${TEMP_DIR}/fabric.tar.gz" -C "${TEMP_DIR}"

  cp -f "${TEMP_DIR}/bin/"* "${BLOCKCHAIN_DIR}/bin/"
  cp -f "${TEMP_DIR}/config/"* "${BLOCKCHAIN_DIR}/config/"

  chmod +x "${BLOCKCHAIN_DIR}/bin/"*

  log "Fabric binaries installed."
fi

export PATH="${BLOCKCHAIN_DIR}/bin:${PATH}"
export FABRIC_CFG_PATH="${BLOCKCHAIN_DIR}"

log "Verifying Fabric binaries..."

peer version
cryptogen version
configtxgen version

log "Pulling Fabric Docker images..."

docker pull "hyperledger/fabric-peer:${FABRIC_VERSION}"
docker pull "hyperledger/fabric-orderer:${FABRIC_VERSION}"
docker pull "hyperledger/fabric-tools:${FABRIC_VERSION}"
docker pull "hyperledger/fabric-ccenv:${FABRIC_VERSION}"

log "Pulling supporting database image..."

docker pull couchdb:3.3

log "Fabric tool setup completed successfully."
log "Project root: ${PROJECT_ROOT}"
log "Fabric binaries: ${BLOCKCHAIN_DIR}/bin"