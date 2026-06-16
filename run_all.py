import subprocess
import sys
import time
import os
import base64

# Decode and write agent_config.yaml securely on Cloud environments
b64_config = os.getenv("AGENT_CONFIG_B64")
if b64_config:
    try:
        with open("agent_config.yaml", "w") as f:
            f.write(base64.b64decode(b64_config).decode("utf-8"))
        print("[Supervisor] Successfully created agent_config.yaml from environment.")
    except Exception as e:
        print(f"[Supervisor] Failed to decode AGENT_CONFIG_B64: {e}")

print("[Supervisor] Starting Flask Web Dashboard (backend/dashboard.py)...")
dashboard_process = subprocess.Popen([sys.executable, "backend/dashboard.py"])

# Give Flask 3 seconds to boot up and initialize database
time.sleep(3)

print("[Supervisor] Starting AI Agents Loop (backend/main.py)...")
agents_process = subprocess.Popen([sys.executable, "backend/main.py"])

try:
    # Keep the main process alive, monitor child processes
    while True:
        time.sleep(2)
        # If any of the processes crashed, exit so container restarts
        if dashboard_process.poll() is not None:
            print("[Supervisor] Dashboard process stopped!")
            sys.exit(1)
        if agents_process.poll() is not None:
            print("[Supervisor] Agents process stopped!")
            sys.exit(1)
except KeyboardInterrupt:
    print("[Supervisor] Terminating processes...")
    dashboard_process.terminate()
    agents_process.terminate()
