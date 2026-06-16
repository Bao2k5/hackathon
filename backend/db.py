"""
db.py — Database layer supporting SQLite (local) and PostgreSQL (cloud)
All operations are synchronous for simplicity.
"""
import os
import sqlite3
import uuid
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "")
IS_POSTGRES = DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")
DB_PATH = os.path.join(os.path.dirname(__file__), "expense_approval.db")

if IS_POSTGRES:
    import psycopg2
    import psycopg2.extras
    # Heroku / Render PostgreSQL urls might start with postgres://, convert to postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def get_conn():
    if IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    if IS_POSTGRES:
        c.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            total_budget DOUBLE PRECISION NOT NULL,
            spent_budget DOUBLE PRECISION NOT NULL DEFAULT 0
        );
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id VARCHAR(255) PRIMARY KEY,
            requester VARCHAR(255) NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            department_id INTEGER NOT NULL,
            department_name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            vendor VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
            risk_level VARCHAR(255),
            approved_by VARCHAR(255),
            note TEXT,
            receipt_url TEXT,
            created_at VARCHAR(255) NOT NULL,
            updated_at VARCHAR(255) NOT NULL
        );
        """)
        c.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            expense_id VARCHAR(255) NOT NULL,
            agent_name VARCHAR(255) NOT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            timestamp VARCHAR(255) NOT NULL
        );
        """)

        # Seed departments if empty
        c.execute("SELECT COUNT(*) FROM departments")
        existing = c.fetchone()[0]
        if existing == 0:
            departments = [
                (1, "Engineering",   50000.0, 18000.0),
                (2, "Marketing",     30000.0, 12500.0),
                (3, "HR",            20000.0,  8000.0),
                (4, "Finance",       40000.0, 15000.0),
                (5, "Operations",    25000.0,  9500.0),
            ]
            for dept in departments:
                c.execute(
                    "INSERT INTO departments (id, name, total_budget, spent_budget) VALUES (%s,%s,%s,%s)",
                    dept
                )
    else:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            total_budget REAL NOT NULL,
            spent_budget REAL NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            requester TEXT NOT NULL,
            amount REAL NOT NULL,
            department_id INTEGER NOT NULL,
            department_name TEXT NOT NULL,
            category TEXT NOT NULL,
            vendor TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            risk_level TEXT,
            approved_by TEXT,
            note TEXT,
            receipt_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_id TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL
        );
        """)

        # Seed departments if empty
        existing = c.execute("SELECT COUNT(*) FROM departments").fetchone()[0]
        if existing == 0:
            departments = [
                (1, "Engineering",   50000.0, 18000.0),
                (2, "Marketing",     30000.0, 12500.0),
                (3, "HR",            20000.0,  8000.0),
                (4, "Finance",       40000.0, 15000.0),
                (5, "Operations",    25000.0,  9500.0),
            ]
            c.executemany(
                "INSERT INTO departments (id, name, total_budget, spent_budget) VALUES (?,?,?,?)",
                departments
            )

    conn.commit()
    conn.close()


def _execute(query: str, params: tuple = (), fetch: str = None, commit: bool = True):
    """Internal helper to execute a query, dynamically mapping syntax between SQLite and Postgres."""
    conn = get_conn()
    try:
        if IS_POSTGRES:
            # Map ? to %s for PostgreSQL
            query = query.replace("?", "%s")
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute(query, params)
            if commit:
                conn.commit()
            if fetch == "all":
                res = [dict(r) for r in cursor.fetchall()]
            elif fetch == "one":
                row = cursor.fetchone()
                res = dict(row) if row else None
            else:
                res = None
            return res
        else:
            cursor = conn.cursor()
            cursor.execute(query, params)
            if commit:
                conn.commit()
            if fetch == "all":
                res = [dict(r) for r in cursor.fetchall()]
            elif fetch == "one":
                row = cursor.fetchone()
                res = dict(row) if row else None
            else:
                res = None
            return res
    except Exception as e:
        if commit:
            conn.rollback()
        raise e
    finally:
        conn.close()


# ── Expense operations ────────────────────────────────────────────────────────

def create_expense(requester: str, amount: float, department_id: int,
                   category: str, vendor: str, description: str, receipt_url: str = None) -> dict:
    dept = _execute("SELECT * FROM departments WHERE id=?", (department_id,), fetch="one")
    if not dept:
        raise ValueError(f"Department {department_id} not found")

    # Ramp-inspired duplicate detection (same requester, amount, vendor, and department within 24 hours)
    import datetime
    time_limit = (datetime.datetime.utcnow() - datetime.timedelta(hours=24)).isoformat()
    dup = _execute("""
        SELECT id FROM expenses 
        WHERE requester=? AND amount=? AND vendor=? AND department_id=? 
          AND created_at >= ? AND status != 'REJECTED'
        LIMIT 1
    """, (requester, amount, vendor, department_id, time_limit), fetch="one")

    note = None
    if dup:
        note = f"[DUPLICATE_WARNING] Potential duplicate of {dup['id']} submitted within 24 hours."

    expense_id = "EXP-" + uuid.uuid4().hex[:8].upper()
    now = datetime.datetime.utcnow().isoformat()

    _execute("""
        INSERT INTO expenses
        (id, requester, amount, department_id, department_name, category, vendor,
         description, status, note, receipt_url, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (expense_id, requester, amount, department_id, dept["name"],
          category, vendor, description, "PENDING", note, receipt_url, now, now))

    return {
        "expense_id": expense_id,
        "department_name": dept["name"],
        "total_budget": dept["total_budget"],
        "spent_budget": dept["spent_budget"],
        "remaining_budget": dept["total_budget"] - dept["spent_budget"],
        "duplicate_warning": note is not None,
        "duplicate_of": dup["id"] if dup else None,
        "note": note
    }



def get_expense(expense_id: str) -> dict | None:
    return _execute("SELECT * FROM expenses WHERE id=?", (expense_id,), fetch="one")


def get_department(department_id: int) -> dict | None:
    return _execute("SELECT * FROM departments WHERE id=?", (department_id,), fetch="one")


def get_all_departments() -> list[dict]:
    return _execute("SELECT * FROM departments ORDER BY id", fetch="all")


def update_expense_status(expense_id: str, status: str,
                           approved_by: str = "", note: str = "",
                           risk_level: str = "") -> bool:
    now = datetime.datetime.utcnow().isoformat()
    _execute("""
        UPDATE expenses
        SET status=?, approved_by=?, note=?, risk_level=?, updated_at=?
        WHERE id=?
    """, (status, approved_by, note, risk_level, now, expense_id))
    return True


def deduct_budget(department_id: int, amount: float) -> bool:
    _execute(
        "UPDATE departments SET spent_budget = spent_budget + ? WHERE id=?",
        (amount, department_id)
    )
    return True


def log_action(expense_id: str, agent_name: str, action: str, details: str = "") -> bool:
    now = datetime.datetime.utcnow().isoformat()
    _execute("""
        INSERT INTO audit_logs (expense_id, agent_name, action, details, timestamp)
        VALUES (?,?,?,?,?)
    """, (expense_id, agent_name, action, details, now))
    return True


def check_policy(amount: float, category: str, vendor: str) -> dict:
    """Pure Python deterministic policy check."""
    APPROVED_VENDORS = {
        "microsoft", "aws", "amazon", "amazon web services", "google",
        "openai", "sap", "salesforce", "oracle", "adobe", "github",
        "atlassian", "slack", "zoom", "notion", "figma", "datadog",
        "snowflake", "stripe", "twilio", "hubspot", "staples", "eventbrite",
        "dell", "apple", "cisco", "ibm", "vmware", "autodesk",
    }
    violations = []
    vendor_lower = vendor.strip().lower()
    vendor_approved = any(v in vendor_lower for v in APPROVED_VENDORS)
    if not vendor_approved:
        violations.append(f"VENDOR_UNKNOWN: '{vendor}' not in approved vendor list — requires Procurement review")
    cat = category.lower()
    if cat == "software" and amount > 1000:
        violations.append(f"SOFTWARE_RULE: Software ${amount:,.2f} > $1,000 requires IT pre-approval")
    if amount > 5000:
        violations.append(f"CFO_THRESHOLD: Amount ${amount:,.2f} > $5,000 requires CFO signature")
    if cat == "travel" and amount > 2000:
        violations.append(f"TRAVEL_RULE: Travel ${amount:,.2f} > $2,000 requires manager pre-approval")
    if cat == "marketing" and amount > 3000:
        violations.append(f"MARKETING_RULE: Marketing ${amount:,.2f} > $3,000 requires VP Marketing sign-off")
    return {
        "vendor_approved": vendor_approved,
        "violations": violations,
        "compliant": len(violations) == 0,
        "status": "COMPLIANT" if len(violations) == 0 else "NON-COMPLIANT",
    }


def approve_expense_tx(expense_id: str, approved_by: str, note: str = "") -> str:
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    conn = get_conn()

    if IS_POSTGRES:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            # Row-level lock in PostgreSQL
            cursor.execute("SELECT status, department_id, amount, department_name FROM expenses WHERE id=%s FOR UPDATE", (expense_id,))
            row = cursor.fetchone()
            if not row:
                conn.rollback()
                return f"ERROR: {expense_id} not found"
            expense = dict(row)
            if expense["status"] in ["APPROVED", "REJECTED"]:
                conn.rollback()
                return f"ERROR: {expense_id} has already been resolved (status: {expense['status']})"

            # Update status
            cursor.execute("""
                UPDATE expenses
                SET status='APPROVED', approved_by=%s, note=%s, updated_at=%s
                WHERE id=%s
            """, (approved_by, note, now, expense_id))

            # Deduct budget
            cursor.execute(
                "UPDATE departments SET spent_budget = spent_budget + %s WHERE id=%s",
                (expense["amount"], expense["department_id"])
            )

            # Audit log
            cursor.execute("""
                INSERT INTO audit_logs (expense_id, agent_name, action, details, timestamp)
                VALUES (%s, 'Approval Notifier', 'APPROVED', %s, %s)
            """, (expense_id, f"Approved by: {approved_by}. Note: {note}", now))

            conn.commit()
            return f"SUCCESS: {expense_id} APPROVED by {approved_by}. Budget of ${expense['amount']:,.2f} deducted from {expense['department_name']}."
        except Exception as e:
            conn.rollback()
            return f"ERROR: Failed to approve: {e}"
        finally:
            conn.close()
    else:
        # SQLite transaction block
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT status, department_id, amount, department_name FROM expenses WHERE id=?", (expense_id,)).fetchone()
            if not row:
                return f"ERROR: {expense_id} not found"
            expense = dict(row)
            if expense["status"] in ["APPROVED", "REJECTED"]:
                return f"ERROR: {expense_id} has already been resolved (status: {expense['status']})"

            conn.execute("""
                UPDATE expenses
                SET status='APPROVED', approved_by=?, note=?, updated_at=?
                WHERE id=?
            """, (approved_by, note, now, expense_id))

            conn.execute(
                "UPDATE departments SET spent_budget = spent_budget + ? WHERE id=?",
                (expense["amount"], expense["department_id"])
            )

            conn.execute("""
                INSERT INTO audit_logs (expense_id, agent_name, action, details, timestamp)
                VALUES (?, 'Approval Notifier', 'APPROVED', ?, ?)
            """, (expense_id, f"Approved by: {approved_by}. Note: {note}", now))

            conn.commit()
            return f"SUCCESS: {expense_id} APPROVED by {approved_by}. Budget of ${expense['amount']:,.2f} deducted from {expense['department_name']}."
        except Exception as e:
            conn.execute("ROLLBACK")
            return f"ERROR: Failed to approve: {e}"
        finally:
            conn.close()


def reject_expense_tx(expense_id: str, rejected_by: str, reason: str = "") -> str:
    import datetime
    now = datetime.datetime.utcnow().isoformat()
    conn = get_conn()

    if IS_POSTGRES:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT status FROM expenses WHERE id=%s FOR UPDATE", (expense_id,))
            row = cursor.fetchone()
            if not row:
                conn.rollback()
                return f"ERROR: {expense_id} not found"
            expense = dict(row)
            if expense["status"] in ["APPROVED", "REJECTED"]:
                conn.rollback()
                return f"ERROR: {expense_id} has already been resolved (status: {expense['status']})"

            cursor.execute("""
                UPDATE expenses
                SET status='REJECTED', approved_by=%s, note=%s, updated_at=%s
                WHERE id=%s
            """, (rejected_by, reason, now, expense_id))

            cursor.execute("""
                INSERT INTO audit_logs (expense_id, agent_name, action, details, timestamp)
                VALUES (%s, 'Approval Notifier', 'REJECTED', %s, %s)
            """, (expense_id, f"Rejected by: {rejected_by}. Reason: {reason}", now))

            conn.commit()
            return f"SUCCESS: {expense_id} REJECTED by {rejected_by}. Reason: {reason}"
        except Exception as e:
            conn.rollback()
            return f"ERROR: Failed to reject: {e}"
        finally:
            conn.close()
    else:
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT status FROM expenses WHERE id=?", (expense_id,)).fetchone()
            if not row:
                return f"ERROR: {expense_id} not found"
            expense = dict(row)
            if expense["status"] in ["APPROVED", "REJECTED"]:
                return f"ERROR: {expense_id} has already been resolved (status: {expense['status']})"

            conn.execute("""
                UPDATE expenses
                SET status='REJECTED', approved_by=?, note=?, updated_at=?
                WHERE id=?
            """, (rejected_by, reason, now, expense_id))

            conn.execute("""
                INSERT INTO audit_logs (expense_id, agent_name, action, details, timestamp)
                VALUES (?, 'Approval Notifier', 'REJECTED', ?, ?)
            """, (expense_id, f"Rejected by: {rejected_by}. Reason: {reason}", now))

            conn.commit()
            return f"SUCCESS: {expense_id} REJECTED by {rejected_by}. Reason: {reason}"
        except Exception as e:
            conn.execute("ROLLBACK")
            return f"ERROR: Failed to reject: {e}"
        finally:
            conn.close()



if __name__ == "__main__":
    init_db()
    print("[DB] Initialized successfully.")
