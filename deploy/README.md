# Deploy to OpenShift

## Prerequisites

- `oc` CLI logged into your OCP cluster
- Image `quay.io/gshanmug-quay/gowtham-hack:latest` built and pushed

## Deploy

1. **Set admin password** – Edit `secret.yaml` and replace `change-me` with your admin password, or create the secret manually:

   ```bash
   oc create namespace escape-the-castle
   oc create secret generic castle-admin \
     --from-literal=admin-password=YOUR_SECRET_PASSWORD \
     -n escape-the-castle
   ```

2. **Apply manifests** (if using the edited secret.yaml):

   ```bash
   oc apply -f namespace.yaml
   oc apply -f secret.yaml   # or skip if you created secret manually
   oc apply -f deployment.yaml
   oc apply -f service.yaml
   oc apply -f route.yaml
   ```

   Or with kustomize:

   ```bash
   oc apply -k .
   ```

3. **Get the public URL**:

   ```bash
   oc get route escape-the-castle -n escape-the-castle
   ```

   The `HOST/PORT` column gives the public URL (e.g. `escape-the-castle-escape-the-castle.apps.cluster.example.com`).

## Persistence

The SQLite database is stored on a 1Gi PVC (`castle-db`), mounted at `/data`. Game data survives pod restarts. To use a specific StorageClass, add `storageClassName: <name>` to `pvc.yaml`.

## TLS

The Route uses edge TLS by default. OCP provisions a certificate automatically.
