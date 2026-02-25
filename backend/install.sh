#!/usr/bin/env bash
# Install backend deps. Use this if "pip install -r requirements.txt" fails (e.g. SSL error).
set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

# Avoid SSL errors on some systems: use trusted hosts
export PIP_TRUSTED_HOST="pypi.org files.pythonhosted.org pypi.python.org"
pip install --upgrade pip
pip install -r requirements.txt

echo "Done. Activate with: source .venv/bin/activate"
echo "Run server: uvicorn main:app --reload --port 8000"
