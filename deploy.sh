#!/bin/bash

# Exit on error
set -e

echo "Starting deployment setup (Separated Services)..."

# 1. Install dependencies and build
echo "Installing client dependencies..."
cd client
npm install
echo "Building client..."
npm run build
cd ..

echo "Installing server dependencies..."
cd server
npm install
echo "Generating Prisma client..."
npx prisma generate
echo "Running database migrations..."
npx prisma db push
echo "Migrating data (linking to EPVC)..."
node migrate_data.js
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
cp $SERVICE_API ${SERVICE_API}.tmp
sed -i "s|/path/to/app|$APP_DIR|g" ${SERVICE_API}.tmp
echo "Copying $SERVICE_API to systemd..."
sudo cp ${SERVICE_API}.tmp /etc/systemd/system/$SERVICE_API
rm ${SERVICE_API}.tmp

# --- Client Service ---
SERVICE_CLIENT="birthday-client.service"
if [ ! -f "$SERVICE_CLIENT" ]; then
    echo "Error: $SERVICE_CLIENT not found!"
    exit 1
fi
echo "Updating paths in $SERVICE_CLIENT..."
cp $SERVICE_CLIENT ${SERVICE_CLIENT}.tmp
sed -i "s|/path/to/app|$APP_DIR|g" ${SERVICE_CLIENT}.tmp
echo "Copying $SERVICE_CLIENT to systemd..."
sudo cp ${SERVICE_CLIENT}.tmp /etc/systemd/system/$SERVICE_CLIENT
rm ${SERVICE_CLIENT}.tmp

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
