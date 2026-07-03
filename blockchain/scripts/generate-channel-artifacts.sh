#!/bin/bash

set -e

echo "Generating channel artifacts..."

cd "$(dirname "$0")/.."

export FABRIC_CFG_PATH=$PWD

mkdir -p channel-artifacts

configtxgen \
  -profile OpsPilotGenesis \
  -channelID system-channel \
  -outputBlock ./channel-artifacts/genesis.block

configtxgen \
  -profile OpsPilotChannel \
  -outputCreateChannelTx ./channel-artifacts/audit-channel.tx \
  -channelID audit-channel

configtxgen \
  -profile OpsPilotChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx \
  -channelID audit-channel \
  -asOrg Org1MSP

configtxgen \
  -profile OpsPilotChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx \
  -channelID audit-channel \
  -asOrg Org2MSP

echo "Channel artifacts generated."