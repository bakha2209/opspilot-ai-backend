#!/bin/bash

set -e

cd "$(dirname "$0")/.."

export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=audit-channel

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.opspilot.com/users/Admin@org1.opspilot.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.opspilot.com/peers/peer0.org1.opspilot.com/tls/ca.crt

peer channel create \
  -o orderer.opspilot.com:7050 \
  --ordererTLSHostnameOverride orderer.opspilot.com \
  -c $CHANNEL_NAME \
  -f ./channel-artifacts/audit-channel.tx \
  --outputBlock ./channel-artifacts/audit-channel.block \
  --tls \
  --cafile $PWD/organizations/ordererOrganizations/opspilot.com/orderers/orderer.opspilot.com/msp/tlscacerts/tlsca.opspilot.com-cert.pem