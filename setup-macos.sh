#!/bin/bash

# Pixelabs Audio Processor - macOS Setup Script
# This script will install and build the application automatically

set -e

echo ""
echo "========================================"
echo "Pixelabs Audio Processor - Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or using Homebrew: brew install node"
    exit 1
fi

echo "Node.js is installed: $(node --version)"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Installing dependencies..."
cd "$SCRIPT_DIR"
npm install

echo ""
echo "Building application..."
npm run build

echo ""
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "The application (.dmg) has been built."
echo "Application location: $SCRIPT_DIR/dist/"
echo ""
echo "To run the application:"
echo "  1. Open the .dmg file in dist/ folder"
echo "  2. Drag the app to Applications folder"
echo "  3. Run it from Applications"
echo ""
