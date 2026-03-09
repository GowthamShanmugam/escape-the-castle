#!/usr/bin/env bash
# Install backend deps. Requires Python 3.10+. Use this if "pip install -r requirements.txt" fails (e.g. SSL error).
set -e
cd "$(dirname "$0")"

need_python() { echo "Python 3.10+ required. You have: $(python3 --version 2>/dev/null || echo 'none')."; exit 1; }
python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" || need_python

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
