export FABRIC_CFG_PATH=$PWD/blockchain
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH=$PWD/blockchain/organizations/peerOrganizations/org2.opspilot.com/users/Admin@org2.opspilot.com/msp
export CORE_PEER_ADDRESS=peer0.org2.opspilot.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/blockchain/organizations/peerOrganizations/org2.opspilot.com/peers/peer0.org2.opspilot.com/tls/ca.crt
export CORE_PEER_TLS_SERVERHOSTOVERRIDE=peer0.org2.opspilot.com