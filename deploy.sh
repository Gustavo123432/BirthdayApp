#!/bin/bash

# Exit on error
set -e

echo "Starting deployment setup (Separated Services)..."

# 1. Install dependencies and build
echo "Installing client dependencies..."
cd client
npm install
echo "Checking client build..."
if [ -d "dist" ]; then
    echo "Client build found (dist folder). Skipping build to save memory."
else
    echo "Building client..."
    npm run build
fi
cd ..

echo "Installing server dependencies..."
cd server
npm install
cd ..

# 2. Setup Systemd Services
echo "Setting up systemd services..."

APP_DIR=$(pwd)

# --- API Service ---
SERVICE_API="birthday-api.service"
if [ ! -f "$SERVICE_API" ]; then
    echo "Error: $SERVICE_API not found!"
    exit 1
fi
echo "Updating paths in $SERVICE_API..."
sed -i "s|/path/to/app|$APP_DIR|g" $SERVICE_API
echo "Copying $SERVICE_API..."
sudo cp $SERVICE_API /etc/systemd/system/

# --- Client Service ---
SERVICE_CLIENT="birthday-client.service"
if [ ! -f "$SERVICE_CLIENT" ]; then
    echo "Error: $SERVICE_CLIENT not found!"
    exit 1
fi
echo "Updating paths in $SERVICE_CLIENT..."
sed -i "s|/path/to/app|$APP_DIR|g" $SERVICE_CLIENT
echo "Copying $SERVICE_CLIENT..."
sudo cp $SERVICE_CLIENT /etc/systemd/system/

# 3. Enable and Start
echo "Reloading systemd..."
sudo systemctl daemon-reload

echo "Stopping old service (if exists)..."
sudo systemctl stop birthday-app || true
sudo systemctl disable birthday-app || true

echo "Starting API..."
sudo systemctl enable birthday-api
sudo systemctl restart birthday-api

echo "Starting Client..."
sudo systemctl enable birthday-client
sudo systemctl restart birthday-client

echo "Deployment complete!"
echo "API running on port 3000"
echo "Client running on port 5173"
