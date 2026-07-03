#!/bin/bash

set -e

cd "$(dirname "$0")/../.."

export PATH=$PWD/blockchain/bin:$PATH
export CHANNEL_NAME=audit-channel

source blockchain/scripts/env-org1.sh

peer channel update \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  -c $CHANNEL_NAME \
  -f blockchain/channel-artifacts/Org1MSPanchors.tx \
  --tls \
  --cafile $PWD/blockchain/organizations/ordererOrganizations/opspilot.com/orderers/orderer.opspilot.com/msp/tlscacerts/tlsca.opspilot.com-cert.pem

source blockchain/scripts/env-org2.sh

peer channel update \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  -c $CHANNEL_NAME \
  -f blockchain/channel-artifacts/Org2MSPanchors.tx \
  --tls \
  --cafile $PWD/blockchain/organizations/ordererOrganizations/opspilot.com/orderers/orderer.opspilot.com/msp/tlscacerts/tlsca.opspilot.com-cert.pem

echo "Anchor peers updated."