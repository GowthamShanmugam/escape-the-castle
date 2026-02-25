#!/bin/bash
# Build and push Escape the Castle to Quay.io
# Usage: ./push-quay.sh [tag]
# Prerequisite: podman login quay.io

set -e
REPO="quay.io/gshanmug-quay/gowtham-hack"
TAG="${1:-latest}"

echo "Building ${REPO}:${TAG} (linux/amd64)..."
podman build --platform linux/amd64 -t "${REPO}:${TAG}" .
echo "Pushing ${REPO}:${TAG}..."
podman push "${REPO}:${TAG}"
echo "Done. Image: ${REPO}:${TAG}"
