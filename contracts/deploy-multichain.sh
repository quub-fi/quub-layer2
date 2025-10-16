#!/bin/bash

# Multi-Chain Deployment Script
# This script deploys contracts to multiple networks and saves addresses

set -e  # Exit on error

echo "🚀 Multi-Chain Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo -e "${RED}Error: Must run from contracts directory${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env with your private key and RPC URLs, then run again${NC}"
    exit 1
fi

# Function to deploy to a network
deploy_to_network() {
    local network=$1
    local network_name=$2

    echo ""
    echo -e "${YELLOW}Deploying to ${network_name}...${NC}"
    echo "----------------------------------------"

    # Run deployment
    npx hardhat run scripts/deploy.js --network $network > /tmp/deploy_${network}.log 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployment successful!${NC}"

        # Extract addresses from log (you may need to adjust based on deploy script output)
        echo ""
        echo "Deployed contracts:"
        cat /tmp/deploy_${network}.log | grep "deployed to:"
        echo ""

        # Save to file
        echo "=== ${network_name} Deployment ===" >> deployments.txt
        echo "Date: $(date)" >> deployments.txt
        cat /tmp/deploy_${network}.log | grep "deployed to:" >> deployments.txt
        echo "" >> deployments.txt
    else
        echo -e "${RED}✗ Deployment failed!${NC}"
        echo "Error log:"
        cat /tmp/deploy_${network}.log
        return 1
    fi
}

# Main deployment flow
echo "Select networks to deploy to:"
echo "1) BSC Testnet"
echo "2) Polygon Mumbai"
echo "3) Both"
echo "4) All (including Sepolia)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        deploy_to_network "bscTestnet" "BSC Testnet"
        ;;
    2)
        deploy_to_network "mumbai" "Polygon Mumbai"
        ;;
    3)
        deploy_to_network "bscTestnet" "BSC Testnet"
        deploy_to_network "mumbai" "Polygon Mumbai"
        ;;
    4)
        deploy_to_network "sepolia" "Ethereum Sepolia"
        deploy_to_network "bscTestnet" "BSC Testnet"
        deploy_to_network "mumbai" "Polygon Mumbai"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Addresses have been saved to: deployments.txt"
echo ""
echo "Next steps:"
echo "1. Check deployments.txt for contract addresses"
echo "2. Update .env.multichain with these addresses"
echo "3. Run: cd ../sequencer && npm run example:multichain"
echo ""
