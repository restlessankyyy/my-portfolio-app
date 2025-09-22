#!/bin/bash

# Portfolio Serverless Cleanup Script
set -e

echo "🗑️  Portfolio Serverless Cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to terraform directory
cd terraform

# Check if terraform state exists
if [ ! -f "terraform.tfstate" ]; then
    print_warning "No terraform state found. Nothing to destroy."
    exit 0
fi

# Show what will be destroyed
print_status "Planning destruction..."
terraform plan -destroy

# Ask for confirmation
echo ""
print_warning "⚠️  This will PERMANENTLY DELETE all AWS resources!"
read -p "Are you sure you want to destroy the infrastructure? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    print_warning "Destruction cancelled."
    exit 0
fi

# Destroy infrastructure
print_status "Destroying infrastructure..."
terraform destroy -auto-approve

print_success "🎉 Infrastructure successfully destroyed!"
print_status "All AWS resources have been removed."