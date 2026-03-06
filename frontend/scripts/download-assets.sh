#!/bin/bash
# Download game images from Wikimedia Commons to frontend/public/images/
# Run from project root: ./frontend/scripts/download-assets.sh
# See ASSETS.md for attribution.

set -e
IMAGES="$PWD/frontend/public/images"
mkdir -p "$IMAGES"
cd "$IMAGES"

echo "Downloading game assets to $IMAGES..."

curl -L -s -A "Mozilla/5.0 (compatible; Game/1.0)" -o dark-room-bg.jpeg \
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dark_Night_(210029631).jpeg?width=1920"

curl -L -s -A "Mozilla/5.0 (compatible; Game/1.0)" -o armory-jigsaw.jpg \
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Dresden,_R%C3%BCstkammer_(Dezember_2023).jpg?width=800"

curl -L -s -A "Mozilla/5.0 (compatible; Game/1.0)" -o chapel-chain-rhythm.jpg \
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Trakai_Island_Castle_Chapel,_Lithuania_-_Diliff.jpg?width=1200"

curl -L -s -A "Mozilla/5.0 (compatible; Game/1.0)" -o key-icon.png \
  "https://commons.wikimedia.org/wiki/Special:Redirect/file/Key-dynamic-premium.png"

echo "Done. Downloaded: dark-room-bg.jpeg, armory-jigsaw.jpg, chapel-chain-rhythm.jpg, key-icon.png"
