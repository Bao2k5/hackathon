# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/dashboard-ui
COPY dashboard-ui/package*.json ./
RUN npm ci
COPY dashboard-ui/ ./
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Copy the compiled React build from Stage 1
COPY --from=frontend-builder /app/dashboard-ui/dist ./dashboard-ui/dist

# Create a non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose ports (dashboard on 5000)
EXPOSE 5000

# Start both AI Agents in background and Web Dashboard in foreground
CMD ["/bin/sh", "-c", "cd backend && python main.py & cd backend && gunicorn --bind 0.0.0.0:${PORT:-5000} dashboard:app"]
