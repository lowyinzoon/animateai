#!/bin/bash
set -e

SERVER="root@187.127.120.208"
PROJECT_DIR="/var/www/animateai"
REPO_URL="https://github.com/lowyinzoon/animateai.git"

echo "Deploying to $SERVER..."

# Push local changes first
echo "Pushing to GitHub..."
git push

# SSH into server, pull, build, restart
echo "Connecting to server..."
ssh "$SERVER" bash -s <<REMOTE
set -e
cd $PROJECT_DIR

# Initialize git repo if not already set up
if [ ! -d ".git" ]; then
  echo "Initializing git in server directory..."
  git init
  git remote add origin $REPO_URL
  git fetch origin
  git reset --hard origin/master
else
  echo "Pulling latest code..."
  git fetch origin
  git reset --hard origin/master
fi

echo "Installing dependencies..."
npm install --production=false

echo "Building..."
npm run build

echo "Restarting PM2..."
pm2 restart animateai

echo "Deploy complete!"
REMOTE

echo "Deployment finished successfully."
