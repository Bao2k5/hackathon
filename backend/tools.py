"""
tools.py — LangChain @tool definitions
Each agent gets a curated subset of these tools.
The agent's LangGraph ReAct loop calls them autonomously.
"""
import json
from langchain_core.tools import tool
import db


# Budget Checker Tools

@tool
def create_expense_record(
    requester: str,
    amount: float,
    department_id: int,
    category: str,
    vendor: str,
    description: str,
) -> str:
    """
    Create a new expense record in the database and return the Expense ID
    plus department budget information.
    Use this FIRST when processing any new expense request.
    CRITICAL: If duplicate detected, auto-escalates to prevent fraud.
    """
    try:
        result = db.create_expense(requester, amount, department_id, category, vendor, description)
        expense_id = result["expense_id"]
        
        # AUTO-ESCALATE DUPLICATES (fraud prevention)
        if result.get("duplicate_warning"):
            db.update_expense_status(
                expense_id, 
                "ESCALATED", 
                note=f"DUPLICATE DETECTED: Possible duplicate of {result.get('duplicate_of')} within 24h. Auto-escalated for fraud review."
            )
            db.log_action(expense_id, "Budget Checker", "DUPLICATE_ESCALATED",
                         f"Auto-escalated due to duplicate detection: {result.get('duplicate_of')}")
        
        db.log_action(expense_id, "Budget Checker", "CREATE_RECORD",
                      f"Created expense for {requester}, amount=${amount}")
        return json.dumps(result)
    except Exception as e:
        return f"ERROR: {e}"


@tool
def check_department_budget(department_id: int) -> str:
    """
    Retrieve current budget status for a department.
    Returns total_budget, spent_budget, remaining_budget.
    Use this to verify if the expense amount fits within the department's budget.
    """
    dept = db.get_department(department_id)
    if not dept:
        return f"ERROR: Department {department_id} not found"
    remaining = dept["total_budget"] - dept["spent_budget"]
    pct_used = (dept["spent_budget"] / dept["total_budget"] * 100) if dept["total_budget"] > 0 else 0
    return json.dumps({
        "department_id": dept["id"],
        "department_name": dept["name"],
        "total_budget": dept["total_budget"],
        "spent_budget": dept["spent_budget"],
        "remaining_budget": remaining,
        "percent_used": round(pct_used, 1),
        "budget_status": "OVER_BUDGET" if remaining < 0 else "OK",
    })


@tool
def get_all_department_budgets() -> str:
    """
    Get budget overview for ALL departments.
    Use this to give context when needed.
    """
    depts = db.get_all_departments()
    result = []
    for d in depts:
        remaining = d["total_budget"] - d["spent_budget"]
        result.append({
            "id": d["id"],
            "name": d["name"],
            "remaining": remaining,
            "status": "OK" if remaining >= 0 else "OVER_BUDGET",
        })
    return json.dumps(result)


# Policy Checker Tools

@tool
def check_policy_compliance(amount: float, category: str, vendor: str) -> str:
    """
    Check if an expense complies with company policy rules.
    Rules cover: vendor whitelist, software limits, CFO thresholds, travel/marketing caps.
    Returns COMPLIANT or NON-COMPLIANT with specific violations listed.
    """
    result = db.check_policy(amount, category, vendor)
    return json.dumps(result)


@tool
def get_expense_details(expense_id: str) -> str:
    """
    Retrieve full details of an expense record by its ID (e.g. EXP-A1B2C3D4).
    Use this to get the most up-to-date state of an expense.
    """
    expense = db.get_expense(expense_id)
    if not expense:
        return f"ERROR: Expense {expense_id} not found"
    return json.dumps(expense)


# Risk Evaluator Tools

@tool
def compute_risk_classification(
    amount: float,
    budget_status: str,
    policy_status: str,
    violations_count: int,
    remaining_budget: float,
    duplicate_warning: bool = False,
) -> str:
    """
    Deterministically compute risk level and routing decision based on inputs.
    Returns: risk_level (LOW/MEDIUM/HIGH) and decision (AUTO_APPROVE/MANAGER_REVIEW/CFO_REVIEW).

    Rules:
    - HIGH: CFO threshold violated OR vendor unknown OR 2+ violations OR duplicate submission OR over budget with >10% shortfall
    - MEDIUM: any policy violation OR budget tight (amount > 80% remaining) OR amount $1000-$5000
    - LOW: fully compliant, budget OK, amount < $1000
    """
    has_cfo_rule = "CFO" in policy_status if policy_status else False
    over_budget = budget_status == "OVER_BUDGET"
    tight_budget = (remaining_budget > 0) and (amount / remaining_budget > 0.8)

    if duplicate_warning:
        risk, decision = "HIGH", "CFO_REVIEW"
    elif violations_count >= 2 or (over_budget and amount > 5000):
        risk, decision = "HIGH", "CFO_REVIEW"
    elif has_cfo_rule or over_budget:
        risk, decision = "HIGH", "CFO_REVIEW"
    elif violations_count >= 1 or tight_budget or (1000 <= amount <= 5000):
        risk, decision = "MEDIUM", "MANAGER_REVIEW"
    else:
        risk, decision = "LOW", "AUTO_APPROVE"

    return json.dumps({"risk_level": risk, "decision": decision})



@tool
def update_risk_level(expense_id: str, risk_level: str, decision: str) -> str:
    """
    Update the expense record with the computed risk level and set status to ESCALATED
    if human review is required.
    """
    status = "PENDING" if decision == "AUTO_APPROVE" else "ESCALATED"
    db.update_expense_status(expense_id, status, risk_level=risk_level)
    db.log_action(expense_id, "Risk Evaluator", f"RISK_{risk_level}",
                  f"Decision: {decision}")
    return f"Updated {expense_id}: risk={risk_level}, status={status}"


# Approval Notifier Tools

@tool
def approve_expense(expense_id: str, approved_by: str, note: str = "") -> str:
    """
    Approve an expense: update status to APPROVED, deduct budget, log audit trail.
    Use this when risk is LOW (auto-approve) or when a human manager/CFO approves.
    Includes retry logic for transient database errors.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = db.approve_expense_tx(expense_id, approved_by, note)
            if result.startswith("SUCCESS"):
                return result
            elif result.startswith("ERROR") and "already been resolved" in result:
                # Already processed, not a transient error
                return result
            elif attempt < max_retries - 1:
                # Transient error, retry
                import time
                time.sleep(0.5 * (attempt + 1))
                continue
            else:
                return result
        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.5 * (attempt + 1))
                continue
            return f"ERROR: Failed after {max_retries} attempts: {e}"
    return "ERROR: Unexpected failure in approve_expense"


@tool
def reject_expense(expense_id: str, rejected_by: str, reason: str = "") -> str:
    """
    Reject an expense: update status to REJECTED, NO budget deduction.
    Use when a human manager/CFO rejects, or policy makes it clearly invalid.
    Includes retry logic for transient database errors.
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = db.reject_expense_tx(expense_id, rejected_by, reason)
            if result.startswith("SUCCESS"):
                return result
            elif result.startswith("ERROR") and "already been resolved" in result:
                return result
            elif attempt < max_retries - 1:
                import time
                time.sleep(0.5 * (attempt + 1))
                continue
            else:
                return result
        except Exception as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.5 * (attempt + 1))
                continue
            return f"ERROR: Failed after {max_retries} attempts: {e}"
    return "ERROR: Unexpected failure in reject_expense"



@tool
def escalate_for_review(expense_id: str, escalation_level: str, message: str) -> str:
    """
    Escalate an expense for human review. Sets status to ESCALATED.
    escalation_level: MANAGER or CFO
    This does NOT approve or reject — it marks the expense as waiting for human decision.
    """
    db.update_expense_status(expense_id, "ESCALATED", note=message)
    db.log_action(expense_id, "Approval Notifier", f"ESCALATED_TO_{escalation_level}", message)
    return f"SUCCESS: {expense_id} escalated to {escalation_level} for review."


# Shared Tools

@tool
def log_agent_action(expense_id: str, agent_name: str, action: str, details: str = "") -> str:
    """
    Write an audit log entry for any agent action.
    Always call this to maintain a full audit trail.
    """
    db.log_action(expense_id, agent_name, action, details)
    return f"Logged: [{agent_name}] {action} for {expense_id}"


# Tool sets per agent

BUDGET_CHECKER_TOOLS = [create_expense_record, check_department_budget,
                         get_all_department_budgets, log_agent_action]

POLICY_CHECKER_TOOLS = [check_policy_compliance, get_expense_details, log_agent_action]

RISK_EVALUATOR_TOOLS = [compute_risk_classification, update_risk_level,
                         get_expense_details, log_agent_action]

APPROVAL_NOTIFIER_TOOLS = [approve_expense, reject_expense, escalate_for_review,
                             get_expense_details, log_agent_action]
