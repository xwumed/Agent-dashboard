#!/bin/bash
# Run the Agent Dashboard Python backend

set -e

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Get port from environment or default to 3006
PORT=${PORT:-3006}

echo "Starting Agent Dashboard Python backend on port $PORT..."
uvicorn server.main:app --host 0.0.0.0 --port $PORT "$@"
