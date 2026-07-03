#!/bin/bash

set -e

cd "$(dirname "$0")/.."

export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=audit-channel

echo "Joining Org1 peer to channel..."

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.opspilot.com/users/Admin@org1.opspilot.com/msp
export CORE_PEER_ADDRESS=peer0.org1.opspilot.com:7051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org1.opspilot.com
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.opspilot.com/peers/peer0.org1.opspilot.com/tls/ca.crt

peer channel join -b ./channel-artifacts/audit-channel.block

echo "Joining Org2 peer to channel..."

export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org2.opspilot.com/users/Admin@org2.opspilot.com/msp
export CORE_PEER_ADDRESS=peer0.org2.opspilot.com:9051
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org2.opspilot.com
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org2.opspilot.com/peers/peer0.org2.opspilot.com/tls/ca.crt

peer channel join -b ./channel-artifacts/audit-channel.block

echo "Both peers joined audit-channel."