#!/bin/bash

# Multi-Chain Setup Verification Script
# Run this before deploying to check your configuration

echo "🔍 Verifying Multi-Chain Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES=0

# Check if we're in the contracts directory
if [ ! -f "hardhat.config.js" ]; then
    echo -e "${RED}❌ Error: Not in contracts directory${NC}"
    echo "   Please run: cd contracts"
    exit 1
fi

echo "✓ In contracts directory"
echo ""

# Check for .env file
echo "📋 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your values"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ .env file exists"

    # Check for required variables
    if ! grep -q "PRIVATE_KEY=" .env; then
        echo -e "${YELLOW}⚠️  Warning: PRIVATE_KEY not set in .env${NC}"
        ISSUES=$((ISSUES + 1))
    else
        if grep -q "PRIVATE_KEY=your_private_key_here" .env || grep -q "PRIVATE_KEY=$" .env; then
            echo -e "${YELLOW}⚠️  Warning: PRIVATE_KEY not configured (still default value)${NC}"
            ISSUES=$((ISSUES + 1))
        else
            echo "✓ PRIVATE_KEY is set"
        fi
    fi
fi
echo ""

# Check Node.js and npm
echo "🔧 Checking development environment..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    ISSUES=$((ISSUES + 1))
else
    NODE_VERSION=$(node -v)
    echo "✓ Node.js installed: $NODE_VERSION"
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    ISSUES=$((ISSUES + 1))
else
    NPM_VERSION=$(npm -v)
    echo "✓ npm installed: $NPM_VERSION"
fi
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Warning: node_modules not found${NC}"
    echo "   Run: npm install"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ Dependencies installed"
fi
echo ""

# Check Hardhat configuration
echo "⚙️  Checking Hardhat networks..."
if npx hardhat 2>&1 | grep -q "bscTestnet"; then
    echo "✓ BSC Testnet configured"
else
    echo -e "${YELLOW}⚠️  Warning: BSC Testnet may not be configured${NC}"
fi

if npx hardhat 2>&1 | grep -q "mumbai"; then
    echo "✓ Polygon Mumbai configured"
else
    echo -e "${YELLOW}⚠️  Warning: Polygon Mumbai may not be configured${NC}"
fi
echo ""

# Check contract files
echo "📄 Checking smart contracts..."
if [ -f "contracts/OptimisticRollup.sol" ]; then
    echo "✓ OptimisticRollup.sol exists"
else
    echo -e "${RED}❌ OptimisticRollup.sol not found${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -f "contracts/L1Bridge.sol" ]; then
    echo "✓ L1Bridge.sol exists"
else
    echo -e "${YELLOW}⚠️  Warning: L1Bridge.sol not found${NC}"
fi
echo ""

# Test RPC connections (if .env exists)
if [ -f ".env" ]; then
    echo "🌐 Testing network connections..."

    # Source the .env file
    export $(cat .env | grep -v '^#' | xargs)

    # Test BSC Testnet
    if [ ! -z "$BSC_TESTNET_URL" ]; then
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            "$BSC_TESTNET_URL" | grep -q "result"; then
            echo "✓ BSC Testnet RPC is reachable"
        else
            echo -e "${YELLOW}⚠️  Warning: BSC Testnet RPC unreachable${NC}"
            ISSUES=$((ISSUES + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  BSC_TESTNET_URL not set, will use default${NC}"
    fi

    # Test Mumbai
    if [ ! -z "$MUMBAI_URL" ]; then
        if curl -s -X POST -H "Content-Type: application/json" \
            --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
            "$MUMBAI_URL" | grep -q "result"; then
            echo "✓ Polygon Mumbai RPC is reachable"
        else
            echo -e "${YELLOW}⚠️  Warning: Polygon Mumbai RPC unreachable${NC}"
            ISSUES=$((ISSUES + 1))
        fi
    else
        echo -e "${YELLOW}⚠️  MUMBAI_URL not set, will use default${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping network tests (no .env file)${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! You're ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure your private key has testnet funds"
    echo "  2. Run: ./deploy-multichain.sh"
    echo ""
else
    echo -e "${YELLOW}⚠️  Found $ISSUES issue(s) - please fix them before deploying${NC}"
    echo ""
    echo "Quick fixes:"
    echo "  • Missing .env: cp .env.example .env"
    echo "  • Missing deps: npm install"
    echo "  • Configure .env with your private key and RPC URLs"
    echo ""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ISSUES
