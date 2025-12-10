#!/bin/bash

# Create a clean deployment package for Lambda
set -e

echo "📦 Creating clean Lambda deployment package..."

# Clean up any existing build
rm -rf .lambda-build
rm -f terraform/portfolio-lambda.zip

# Create build directory
mkdir -p .lambda-build

# Copy only necessary files
echo "Copying essential files..."
cp lambda.js .lambda-build/
cp server.js .lambda-build/
cp package.json .lambda-build/

# Copy public directory (static assets)
cp -r public .lambda-build/

# Create a minimal package.json for production
cat > .lambda-build/package.json << EOF
{
  "name": "ankit-raj-portfolio",
  "version": "2.0.0",
  "main": "lambda.js",
  "dependencies": {
    "express": "^4.18.2",
    "@vendia/serverless-express": "^4.12.6"
  }
}
EOF

# Install only production dependencies
echo "Installing production dependencies..."
cd .lambda-build
npm install --production --no-audit --no-fund

# Remove unnecessary files from node_modules
echo "Optimizing node_modules..."
find node_modules -name "*.md" -delete
find node_modules -name "*.txt" -delete
find node_modules -name "*.ts" -delete
find node_modules -name "test*" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "docs*" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "example*" -type d -exec rm -rf {} + 2>/dev/null || true

cd ..

# Create the zip file
echo "Creating zip file..."
cd .lambda-build
zip -r ../terraform/portfolio-lambda.zip . -q
cd ..

# Get file size
FILE_SIZE=$(du -h terraform/portfolio-lambda.zip | cut -f1)
echo "✅ Lambda package created: $FILE_SIZE"

# Clean up build directory
rm -rf .lambda-build

echo "🎯 Ready for deployment!"