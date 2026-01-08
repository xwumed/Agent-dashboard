FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy and build frontend
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Install Python dependencies
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ ./server/

EXPOSE 3006

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "3006"]
