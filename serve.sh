#!/bin/zsh

source ~/.zshrc

# Build the files
cd services/astro
npm run build

# Serve the files
cd dist
echo "Starting server at: http://localhost:54321"
serve 54321
