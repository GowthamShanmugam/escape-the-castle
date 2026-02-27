# Deploy to OpenShift

## Prerequisites

- `oc` CLI logged into your OCP cluster
- Image `quay.io/gshanmug-quay/escape-the-castle:latest` built and pushed

## Deploy

1. **Apply manifests**:

   ```bash
   oc apply -k .
   ```

2. **Get the public URL**:

   ```bash
   oc get route escape-the-castle -n escape-the-castle
   ```

   The `HOST/PORT` column gives the public URL (e.g. `escape-the-castle-escape-the-castle.apps.cluster.example.com`).

## Persistence

The SQLite database is stored on a 1Gi PVC (`castle-db`), mounted at `/data`. Game data survives pod restarts. To use a specific StorageClass, add `storageClassName: <name>` to `pvc.yaml`.

## TLS

The Route uses edge TLS by default. OCP provisions a certificate automatically.
