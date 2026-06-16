# ExpenseAI — Enterprise Multi-Agent Expense Approval System

> **Band of Agents Hackathon 2026 — Track 1: Internal Enterprise Workflows**  
> **From 5 Days to 20 Seconds — Autonomous Multi-Agent Collaboration with Human-in-the-Loop Safeguards**

[![Band SDK](https://img.shields.io/badge/Orchestration-Band%20SDK-6366f1?style=flat-square)](https://docs.band.ai)
[![Featherless AI](https://img.shields.io/badge/LLM%20Inference-Featherless%20AI%20(Qwen%202.5)--72B)-34d399?style=flat-square)](https://featherless.ai)
[![AI/ML API](https://img.shields.io/badge/LLM%20Gateway-AI%2FML%20API%20(GPT--4o--mini)-0284c7?style=flat-square)](https://aimlapi.com)
[![Docker Support](https://img.shields.io/badge/Deployment-Docker%20Compose-2496ed?style=flat-square)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=flat-square)](#)

---

## 🎥 Demo Video & Live Application

- **[📹 Watch our 3-Minute Demo Video](https://youtu.be/YOUR_VIDEO_ID)** *(Replace with your actual YouTube URL)*
- **[🌐 Live Demo Application](https://localhost:5000)** *(Or your Railway/Render deployment URL)*

![ExpenseAI Dashboard Preview](https://via.placeholder.com/800x400/1e1b4b/818cf8?text=ExpenseAI+Dashboard+Preview)  
*Figure 1: The ExpenseAI interactive manager control panel and real-time ROI tracking dashboard.*

---

## 💡 Inspiration (The Problem)

Enterprise expense approval is traditionally slow, manual, and highly vulnerable to error or fraud. A typical request transitions slowly across multiple desks:

```
Employee submits request ➡️ Manager's email inbox (3 days late) ➡️ Finance team policy check (manual checklist) ➡️ CFO approval for large amounts ➡️ Reimbursement: 5–10 business days.
```

This manual workflow costs companies an average of **$2,000 per request** (in administrator and manager labor hours) and is prone to overlooking double-submissions, compliance violations, and budget overruns.

**ExpenseAI solves this by replacing the entire pipeline with a 20-second automated agentic workflow.**

---

## 🚀 The Solution: Coordinated Multi-Agent Orchestration

We built a team of **4 specialized AI agents** that coordinate in a shared Band room to process, validate, risk-assess, and finalize expense approvals.

1. **Budget Checker** 💰: The entry point. Parses raw inputs, checks department budgets, detects fraudulent duplicates, and initializes records.
2. **Policy Checker** 📋: The compliance gatekeeper. Validates vendor status and verifies transactions against corporate policy guidelines.
3. **Risk Evaluator** ⚖️: The analytical brain. Synthesizes findings from budget and policy checks, computes the final risk level (LOW/MEDIUM/HIGH), and determines routing.
4. **Approval Notifier** ✅: The dispatcher. Automatically approves LOW-risk items in seconds and escalates MEDIUM/HIGH-risk requests to human managers/CFOs.

---

## 🛠️ Tech Stack & Integrations

We utilized cutting-edge tools to construct a highly resilient, enterprise-grade architecture:

- **Band SDK**: Serves as the communication backbone. Agents operate concurrently, passing structured contexts and handling task transfers via WebSockets in a shared room using `@mentions`.
- **Featherless AI (Qwen 2.5-72B)**: Leveraged for the **Policy Checker**. This heavy open-source model excels at complex compliance logic and text-based reasoning.
- **AI/ML API (GPT-4o-mini)**: Leveraged for the **Budget Checker** and **Risk Evaluator** to minimize latency and optimize API costs.
- **LangGraph & LangChain**: Drives the local ReAct agent loop (think ➡️ act ➡️ observe) for autonomous tool utilization.
- **Flask (Backend) & React + TypeScript (Vite UI)**: Powers a modern, responsive web dashboard with live activity feeds and cost-savings tracking.
- **SQLite3 & PostgreSQL**: Supports local file-based database storage and cloud-ready databases with atomic transaction capabilities.

---

## 🧠 Challenges We Ran Into & How We Overcame Them

### 1. Loop Control & Message Noise in Shared Rooms
In a multi-agent environment where agents chat in a shared workspace, agents can easily trigger infinite response loops or generate unnecessary noise.  
* **Our Solution**: We restricted agent activations using strict regex triggers, required explicit `@mention` handoffs, and configured compact, JSON-like tool responses to keep the Band workspace clean and focused.

### 2. Database Race Conditions under Load
If two managers attempt to approve high-priority expenses at the exact same millisecond, standard database writes can cause double-spending or status conflicts.  
* **Our Solution**: We implemented atomic database transaction protection using `BEGIN IMMEDIATE` locks in SQLite and strict isolation levels in PostgreSQL. We also added a 3-attempt exponential backoff retry mechanism to prevent failures during high-concurrency periods.

### 3. Latency vs. Reasoning Quality
Running heavy reasoning LLMs for simple tasks slows down the system, while using lightweight models for complex compliance reviews causes security oversights.  
* **Our Solution**: We designed a multi-model routing layer. Fast, inexpensive models handle formatting and risk grading, while the deep Qwen 2.5-72B model on Featherless AI evaluates policy documents.

---

## 🏆 Accomplishments We're Proud Of

- **Enterprise-Grade Resilience**: Built a system that does not crash under concurrent load, verified by our custom automated stress tests.
- **Real-Time ROI Calculation**: Designed a live dashboard banner calculating hours and dollars saved by comparing manual costs ($2,000/request) vs. AI costs ($0.01/request).
- **SOX-Compliant Audit Trails**: Fully transparent activity logs recording every agent's thoughts, tools used, timestamps, and human override actions.

---

## 📖 What We Learned

- **Microservice Design for Agents**: Building agents is very similar to designing microservices; defining clean input/output schemas is critical for collaboration.
- **Human-in-the-Loop is Essential**: High-stakes operations should never run fully autonomously. Creating seamless escalations to human channels builds trust and ensures security.

---

## 🔮 Future Roadmap for ExpenseAI

1. **Adaptive Budgeting**: Automatically adjusting department budgets based on historical seasonal spend patterns.
2. **Legal Contract Analyzer**: Expanding the Policy Checker to cross-reference expenses against legal supplier contract terms.
3. **Cross-Agent Verification**: Adding a verification loop where agents doublecheck each other's outputs before final approval.
4. **Instant Slack/Teams Actions**: Integrating notifications and approval buttons directly into enterprise chat platforms.

---

## 🏁 Getting Started

### Prerequisites
- **Docker Desktop** (Recommended) OR **Python 3.11+**
- 4 agents created at [band.ai](https://band.ai)
- API Keys: AI/ML API Key, Featherless AI Key, and Band credentials.

---

### 🐳 Quick Start with Docker (Recommended)

1. **Clone the Repository & Configure Environment**
   ```bash
   git clone <your-repo-url>
   cd expense-approval-system
   cp .env.example .env
   ```
   Edit `.env` and fill in your keys:
   ```env
   OPENAI_API_KEY=your_aimlapi_key_here
   BAND_ROOM_ID=your_band_room_id_here
   BAND_BOT_TOKEN=your_band_bot_token_here
   FEATHERLESS_API_KEY=your_featherless_key_here
   POSTGRES_PASSWORD=changeme123
   ```
   Configure `agent_config.yaml` with your 4 agent credentials.

2. **Start Services**
   ```bash
   docker-compose up -d
   ```
   Open **http://localhost:5000** to view the live dashboard.

---

### 🐍 Alternative: Local Python Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure Environment** (Same as Docker steps above).
3. **Launch the Application**
   * **Windows One-Click Launcher**: Double-click `start.bat`.
   * **Manual Command Line**:
     ```bash
     # Terminal 1: Run AI Agents
     python backend/main.py

     # Terminal 2: Run Flask Dashboard
     python backend/dashboard.py
     ```

---

## 🧪 Testing & Validation

Validate local system resilience using our custom testing suite:

* **Automated Scenario Demo**: Run a simulated low/medium/high risk pipeline test.
  ```bash
  python demo.py
  ```
* **Concurrency Stress Test**: Simulate 10 simultaneous approvals to verify database locking.
  ```bash
  python stress_test.py
  ```
* **Fraud Detection Test**: Verify duplicate detection and auto-escalation.
  ```bash
  python stress_test.py duplicate
  ```
* **Compliance Auditor**: Generate a SOX-compliant audit report file (`compliance_report.txt`).
  ```bash
  python compliance_report.py
  ```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/submit` | POST | Submits a new expense request |
| `/api/expenses` | GET | Lists all expense requests |
| `/api/departments`| GET | Returns departments and current budget status |
| `/api/roi` | GET | Calculates current manual vs. AI savings |
| `/api/metrics` | GET | Business intelligence analytics and distributions |
| `/api/compliance-report` | GET | Generates live SOX audit reports |
| `/api/override/:id`| POST | Human override action (Approve/Reject) |
| `/api/history` | GET | Full audit logs for agent actions |

---

## ☁️ Cloud Deployment

For production deployments, see our [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) guide which includes 1-click guides for:
- **Railway.app** (Flask Backend + PostgreSQL)
- **Render.com + Neon.tech** (Web service + Cloud Database)

---

## 📜 License & Copyright

All Rights Reserved.

Copyright (c) 2026. This project and its source code are proprietary. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
