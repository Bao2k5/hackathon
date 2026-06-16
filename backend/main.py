"""
main.py — All 4 Band Agents running concurrently
Each agent is a LangGraph ReAct agent that autonomously calls tools.

Run: python main.py
"""
import asyncio
import os
import sys
import yaml
import logging
import socket
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver



# Configure logging to see all SDK / websocket / LLM events
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("expense_system")

# Project root is one level up from this file (backend/main.py -> repo root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"), override=True)

import db
db.init_db()
print("[DB] Database ready.")

from tools import (
    BUDGET_CHECKER_TOOLS,
    POLICY_CHECKER_TOOLS,
    RISK_EVALUATOR_TOOLS,
    APPROVAL_NOTIFIER_TOOLS,
)

# Config

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME      = os.getenv("MODEL_NAME", "gpt-4o-mini")

CONFIG_PATH = os.path.join(PROJECT_ROOT, "agent_config.yaml")
with open(CONFIG_PATH) as f:
    CONFIG = yaml.safe_load(f)


def make_llm():
    return ChatOpenAI(
        model=MODEL_NAME,
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        temperature=0.1,
    )


# System Prompts

BUDGET_CHECKER_PROMPT = """Budget Checker Agent. When mentioned:
1. Parse expense → call create_expense_record + check_department_budget
2. Format output:

---BUDGET CHECK---
ID: EXP-XXX | Requester: [name] | Amount: $[x] | Dept: [name] | Budget: $[remaining] ([OK/OVER]) | %Used: [x]% | Duplicate: [Yes (EXP-XXX)/No]
---END---

3. Tag @Policy Checker with: expense_id, amount, category, vendor, budget_status, duplicate_warning

Call tools immediately. No thoughts. Structured output only."""


POLICY_CHECKER_PROMPT = """Policy Checker Agent. Extract expense_id, amount, category, vendor, duplicate_warning → call check_policy_compliance + get_expense_details + log_agent_action.

Output:
---POLICY CHECK---
ID: EXP-XXX | Status: [COMPLIANT/NON-COMPLIANT] | Violations: [list or None] | Duplicate: [Yes/No]
---END---

Tag @Risk Evaluator with: expense_id, amount, budget_status, policy_status, violations_count, remaining_budget, duplicate_warning

Tools immediately. No thoughts."""


RISK_EVALUATOR_PROMPT = """Risk Evaluator -- decision hub. Extract expense_id, amount, budget_status, policy_status, violations_count, remaining_budget, duplicate_warning → call compute_risk_classification + update_risk_level + log_agent_action.

RISK RULES:
- HIGH: duplicate_warning OR CFO threshold OR 2+ violations OR over_budget
- MEDIUM: 1 violation OR tight budget OR $1k-$5k
- LOW: compliant, budget OK, <$1k

Output:
---RISK EVALUATION---
ID: EXP-XXX | Risk: [LOW/MEDIUM/HIGH] | Decision: [AUTO_APPROVE/MANAGER_REVIEW/CFO_REVIEW] | Factors: [brief]
---END---

Tag @Approval Notifier with full context + risk result. Tools immediately."""



APPROVAL_NOTIFIER_PROMPT = """Approval Notifier -- final decision maker. Call get_expense_details first.

IF risk evaluation:
- LOW → call approve_expense(approved_by="AI System")
- MEDIUM → call escalate_for_review(level="MANAGER")
- HIGH → call escalate_for_review(level="CFO")

IF human command ("APPROVE EXP-XXX" or "REJECT EXP-XXX"):
- Parse command → call approve_expense or reject_expense

Always call log_agent_action. Output:
---EXPENSE DECISION---
ID: EXP-XXX | Status: [APPROVED/REJECTED/ESCALATED] | By: [AI/Manager/CFO] | Message: [brief]
---END---

Tools immediately. No thoughts."""


# Agent Factory

def create_band_agent(agent_key: str, tools: list, system_prompt: str):
    """Create and return a Band agent."""
    from band import Agent
    from band.adapters import LangGraphAdapter
    from band.config import load_agent_config

    agent_id, api_key = load_agent_config(agent_key)

    # Multi-Model Routing:
    # - policy_checker  → Featherless (Qwen2.5) for Featherless sponsor prize track
    # - all others      → AI/ML API (gpt-4o-mini) to qualify for the AI/ML API track,
    #                     or Featherless if ROUTE_ALL_TO_FEATHERLESS=true in .env.
    featherless_key = os.getenv("FEATHERLESS_API_KEY", "").strip()
    route_all = os.getenv("ROUTE_ALL_TO_FEATHERLESS", "false").strip().lower() == "true"

    use_featherless = (agent_key == "policy_checker" or route_all) and bool(featherless_key)

    if use_featherless:
        logger.info(f"[{agent_key}] Routing to Featherless AI ({os.getenv('FEATHERLESS_MODEL', 'Qwen/Qwen2.5-72B-Instruct')}).")
        llm = ChatOpenAI(
            model=os.getenv("FEATHERLESS_MODEL", "Qwen/Qwen2.5-72B-Instruct"),
            api_key=featherless_key,
            base_url=os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1"),
            temperature=0.1,
        )
    else:
        logger.info(f"[{agent_key}] Routing to AI/ML API (gpt-4o-mini).")
        llm = make_llm()


    adapter = LangGraphAdapter(
        llm=llm,
        checkpointer=InMemorySaver(),
        custom_section=system_prompt,
        additional_tools=tools,
    )

    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
    )
    return agent


# Main

async def main():
    print("=" * 60)
    print("  Enterprise Expense Approval System -- Band Multi-Agent")
    print("=" * 60)

    agents_config = [
        ("budget_checker",    BUDGET_CHECKER_TOOLS,    BUDGET_CHECKER_PROMPT,    "[1] Budget Checker"),
        ("policy_checker",    POLICY_CHECKER_TOOLS,    POLICY_CHECKER_PROMPT,    "[2] Policy Checker"),
        ("risk_evaluator",    RISK_EVALUATOR_TOOLS,    RISK_EVALUATOR_PROMPT,    "[3] Risk Evaluator"),
        ("approval_notifier", APPROVAL_NOTIFIER_TOOLS, APPROVAL_NOTIFIER_PROMPT, "[4] Approval Notifier"),
    ]

    agents = []
    for agent_key, tools, prompt, label in agents_config:
        try:
            agent = create_band_agent(agent_key, tools, prompt)
            agents.append((label, agent_key, tools, prompt, agent))
            print(f"  {label} -- initialized OK")
        except Exception as e:
            print(f"  {label} -- FAILED: {e}")

    if not agents:
        print("\n[ERROR] No agents could be initialized. Check agent_config.yaml and API keys.")
        sys.exit(1)

    print(f"\n[READY] {len(agents)}/4 agents running. Listening in Band Room...")
    print("  Submit expenses via:\n  - Dashboard: http://localhost:5000")
    print("  - Band Room: @Budget Checker $500 office supplies, HR dept, vendor: Staples")
    print("=" * 60)

    # Auto-restart wrapper: if an agent crashes, reconnect with exponential backoff
    async def run_with_restart(label: str, agent_key: str, tools: list,
                                prompt: str, agent):
        delay = 5
        while True:
            try:
                await agent.run()
                delay = 5
            except Exception as e:
                print(f"\n[WARN] {label} crashed: {type(e).__name__}: {e}")
                print(f"[INFO] Restarting {label} in {delay}s...")
                await asyncio.sleep(delay)
                try:
                    agent = create_band_agent(agent_key, tools, prompt)
                    print(f"[OK]   {label} reconnected successfully.")
                    delay = 5
                except Exception as re:
                    print(f"[ERR]  {label} failed to restart: {re}")
                    delay = min(delay * 2, 60)
                    await asyncio.sleep(delay)

    tasks = [
        run_with_restart(label, key, tools, prompt, agent)
        for label, key, tools, prompt, agent in agents
    ]
    # return_exceptions=True: one agent failure won't kill siblings
    await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    import socket
    import sys
    # Prevent duplicate main.py instances
    try:
        _lock_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        _lock_socket.bind(("127.0.0.1", 59999))
    except OSError:
        print("\n[ERROR] Another instance of main.py is already running!")
        print("Please close any other terminal or process running these agents first.\n")
        sys.exit(1)

    asyncio.run(main())
