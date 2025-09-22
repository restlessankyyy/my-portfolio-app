#!/bin/bash

# Portfolio Serverless Deployment Script
set -e

echo "🚀 Starting Portfolio Serverless Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "Checking AWS credentials..."
aws sts get-caller-identity

# Navigate to terraform directory
cd terraform

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found. Creating from example..."
    cp terraform.tfvars.example terraform.tfvars
    print_warning "Please edit terraform/terraform.tfvars with your configuration before continuing."
    read -p "Press enter to continue after editing terraform.tfvars..."
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
cd ..
npm install --production

# Initialize Terraform
print_status "Initializing Terraform..."
cd terraform
terraform init

# Plan deployment
print_status "Planning deployment..."
terraform plan

# Ask for confirmation
echo ""
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Apply deployment
print_status "Deploying infrastructure..."
terraform apply -auto-approve

# Get outputs
print_success "Deployment completed!"
echo ""
print_status "Your portfolio is now live at:"
terraform output -raw api_gateway_url

echo ""
print_status "Lambda function name:"
terraform output -raw lambda_function_name

echo ""
print_status "S3 bucket for assets:"
terraform output -raw s3_bucket_name

echo ""
print_success "🎉 Portfolio successfully deployed to AWS Lambda!"
print_status "You can monitor logs in CloudWatch at:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$(terraform output -raw deployment_info | jq -r '.region')#logStream:group=$(terraform output -raw cloudwatch_log_group)"