#!/bin/bash
# Deploy Escape the Castle to OpenShift
# Prerequisite: oc login

set -e
echo "Deploying to OCP namespace escape-the-castle..."
oc apply -k .

echo ""
echo "Waiting for rollout..."
oc rollout status deployment/escape-the-castle -n escape-the-castle --timeout=120s

echo ""
echo "Route:"
oc get route escape-the-castle -n escape-the-castle
