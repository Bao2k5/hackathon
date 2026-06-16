#!/bin/sh
echo "Khởi động 4 AI Agents..."
python backend/main.py &

echo "Khởi động Web Server..."
gunicorn --bind 0.0.0.0:8000 backend.dashboard:app
