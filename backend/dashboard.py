"""
dashboard.py — Flask web dashboard for expense submission
Run: python dashboard.py  → http://localhost:5000
"""
import os
import sqlite3
from flask import Flask, render_template_string, request, jsonify
from dotenv import load_dotenv

import sys
# Project root is one level up from this file (backend/dashboard.py -> repo root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"), override=True)

import db
db.init_db()

app = Flask(
    __name__,
    static_folder=os.path.join(PROJECT_ROOT, "dashboard-ui", "dist"),
    static_url_path=""
)

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ExpenseAI — Enterprise Expense Approval</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    background: #0a0a14;
    color: #e2e8f0;
    min-height: 100vh;
  }
  .header {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%);
    padding: 24px 40px;
    border-bottom: 1px solid rgba(99,102,241,0.3);
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo { font-size: 28px; font-weight: 700; color: #818cf8; }
  .logo span { color: #e2e8f0; }
  .tagline { font-size: 13px; color: #94a3b8; }
  .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 28px;
  }
  .card h2 { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #c7d2fe; }
  .form-group { margin-bottom: 16px; }
  label { display: block; font-size: 12px; font-weight: 500; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  input, select, textarea {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 10px 14px;
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    transition: border-color 0.2s;
  }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(99,102,241,0.05);
  }
  select option { background: #1e1b4b; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
  .pipeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
  }
  .agent-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1;
  }
  .agent-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid rgba(255,255,255,0.1);
  }
  .agent-name { font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.3; }
  .arrow { color: #4f46e5; font-size: 18px; opacity: 0.6; }
  .expense-list { max-height: 400px; overflow-y: auto; }
  .expense-item {
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    margin-bottom: 10px;
    transition: all 0.2s;
  }
  .expense-item:hover { border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.05); }
  .exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .exp-id { font-size: 11px; color: #818cf8; font-weight: 600; }
  .badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 20px;
    text-transform: uppercase;
  }
  .badge-APPROVED { background: rgba(16,185,129,0.2); color: #34d399; }
  .badge-REJECTED { background: rgba(239,68,68,0.2); color: #f87171; }
  .badge-PENDING { background: rgba(245,158,11,0.2); color: #fbbf24; }
  .badge-ESCALATED { background: rgba(249,115,22,0.2); color: #fb923c; }
  .btn-action-container { display: flex; gap: 8px; margin-top: 12px; }
  .btn-action {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0;
    width: auto;
  }
  .btn-action-approve {
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.3);
  }
  .btn-action-approve:hover {
    background: rgba(16,185,129,0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16,185,129,0.2);
  }
  .btn-action-reject {
    background: rgba(239,68,68,0.15);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.3);
  }
  .btn-action-reject:hover {
    background: rgba(239,68,68,0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239,68,68,0.2);
  }
  .exp-amount { font-size: 18px; font-weight: 700; color: #e2e8f0; }
  .exp-meta { font-size: 12px; color: #64748b; }
  .toast {
    position: fixed;
    bottom: 24px; right: 24px;
    background: #1e293b;
    border: 1px solid rgba(99,102,241,0.4);
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 14px;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s;
    z-index: 1000;
    max-width: 320px;
  }
  .toast.show { transform: translateY(0); opacity: 1; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }
  .stat-num { font-size: 28px; font-weight: 700; color: #818cf8; }
  .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; }
  
  /* ROI Banner */
  .roi-banner {
    background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(52,211,153,0.05));
    border: 1px solid rgba(16,185,129,0.2);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  .roi-item {
    text-align: center;
  }
  .roi-value {
    font-size: 24px;
    font-weight: 700;
    color: #34d399;
  }
  .roi-label {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    text-transform: uppercase;
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Expense<span>AI</span></div>
    <div class="tagline">4-Agent Enterprise Approval System — Band of Agents Hackathon 2026</div>
  </div>
</div>

<div class="container">
  <!-- ROI Banner -->
  <div class="roi-banner" id="roiBanner" style="display:none">
    <div class="roi-item">
      <div class="roi-value" id="roi-savings">$0</div>
      <div class="roi-label">Total Savings</div>
    </div>
    <div class="roi-item">
      <div class="roi-value" id="roi-time">0h</div>
      <div class="roi-label">Time Saved</div>
    </div>
    <div class="roi-item">
      <div class="roi-value" id="roi-percentage">0%</div>
      <div class="roi-label">ROI</div>
    </div>
    <div class="roi-item">
      <div class="roi-value" id="roi-requests">0</div>
      <div class="roi-label">Requests Processed</div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats" id="stats">
    <div class="stat"><div class="stat-num" id="stat-total">0</div><div class="stat-label">Total Requests</div></div>
    <div class="stat"><div class="stat-num" id="stat-approved" style="color:#34d399">0</div><div class="stat-label">Approved</div></div>
    <div class="stat"><div class="stat-num" id="stat-pending" style="color:#fbbf24">0</div><div class="stat-label">Pending/Escalated</div></div>
    <div class="stat"><div class="stat-num" id="stat-rejected" style="color:#f87171">0</div><div class="stat-label">Rejected</div></div>
  </div>

  <div class="grid">
    <!-- Submit Form -->
    <div class="card">
      <h2>Submit Expense Request</h2>

      <!-- Agent Pipeline -->
      <div class="pipeline">
        <div class="agent-node">
          <div class="agent-icon" style="background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.3)">💰</div>
          <div class="agent-name">Budget<br>Checker</div>
        </div>
        <div class="arrow">→</div>
        <div class="agent-node">
          <div class="agent-icon" style="background:rgba(168,85,247,0.15);border-color:rgba(168,85,247,0.3)">📋</div>
          <div class="agent-name">Policy<br>Checker</div>
        </div>
        <div class="arrow">→</div>
        <div class="agent-node">
          <div class="agent-icon" style="background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.3)">⚖️</div>
          <div class="agent-name">Risk<br>Evaluator</div>
        </div>
        <div class="arrow">→</div>
        <div class="agent-node">
          <div class="agent-icon" style="background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3)">✅</div>
          <div class="agent-name">Approval<br>Notifier</div>
        </div>
      </div>

      <form id="expenseForm">
        <div class="row">
          <div class="form-group">
            <label>Requester Name</label>
            <input type="text" id="requester" placeholder="John Smith" required>
          </div>
          <div class="form-group">
            <label>Amount (USD)</label>
            <input type="number" id="amount" placeholder="500.00" step="0.01" min="1" required>
          </div>
        </div>
        <div class="row">
          <div class="form-group">
            <label>Department</label>
            <select id="department_id" required>
              <option value="1">Engineering</option>
              <option value="2">Marketing</option>
              <option value="3">HR</option>
              <option value="4">Finance</option>
              <option value="5">Operations</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="category" required>
              <option value="software">Software</option>
              <option value="hardware">Hardware</option>
              <option value="travel">Travel</option>
              <option value="marketing">Marketing</option>
              <option value="office">Office Supplies</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Vendor</label>
          <input type="text" id="vendor" placeholder="Microsoft, AWS, Google..." required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="description" rows="2" placeholder="Brief description of the expense..." required></textarea>
        </div>
        <button type="submit" class="btn btn-primary" id="submitBtn">
          Submit for AI Review
        </button>
      </form>
    </div>

    <!-- Expense List -->
    <div class="card">
      <h2>Recent Expenses</h2>
      <div class="expense-list" id="expenseList">
        <p style="color:#64748b;font-size:14px;text-align:center;padding:40px">No expenses yet. Submit one!</p>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
function showToast(msg, ok=true) {
  const t = document.getElementById('toast');
  t.innerHTML = (ok ? '✅ ' : '⚠️ ') + msg;
  t.style.borderColor = ok ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

async function loadExpenses() {
  try {
    const r = await fetch('/api/expenses');
    const data = await r.json();
    const list = document.getElementById('expenseList');
    const stats = {total:0, approved:0, pending:0, rejected:0};
    if (!data.length) {
      list.innerHTML = '<p style="color:#64748b;font-size:14px;text-align:center;padding:40px">No expenses yet. Submit one!</p>';
      return;
    }
    list.innerHTML = data.map(e => {
      stats.total++;
      if (e.status === 'APPROVED') stats.approved++;
      else if (e.status === 'REJECTED') stats.rejected++;
      else stats.pending++;
      return `
      <div class="expense-item">
        <div class="exp-header">
          <span class="exp-id">${e.id}</span>
          <span class="badge badge-${e.status}">${e.status}</span>
        </div>
        <div class="exp-amount">$${Number(e.amount).toLocaleString()}</div>
        <div class="exp-meta">${e.requester} · ${e.department_name} · ${e.category} · ${e.vendor}</div>
        ${e.risk_level ? `<div class="exp-meta" style="margin-top:4px">Risk: <b style="color:#818cf8">${e.risk_level}</b></div>` : ''}
        ${e.status === 'ESCALATED' ? `
        <div class="btn-action-container">
          <button class="btn-action btn-action-approve" onclick="handleOverride('${e.id}', 'APPROVED')">Approve</button>
          <button class="btn-action btn-action-reject" onclick="handleOverride('${e.id}', 'REJECTED')">Reject</button>
        </div>
        ` : ''}
      </div>`;
    }).join('');
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-approved').textContent = stats.approved;
    document.getElementById('stat-pending').textContent = stats.pending;
    document.getElementById('stat-rejected').textContent = stats.rejected;
    
    // Load ROI data
    loadROI();
  } catch(e) { console.error(e); }
}

async function loadROI() {
  try {
    const r = await fetch('/api/roi');
    const roi = await r.json();
    if (roi.total_requests > 0) {
      document.getElementById('roiBanner').style.display = 'flex';
      document.getElementById('roi-savings').textContent = '$' + roi.total_savings_usd.toLocaleString();
      document.getElementById('roi-time').textContent = roi.time_saved_hours.toLocaleString() + 'h';
      document.getElementById('roi-percentage').textContent = roi.roi_percentage + '%';
      document.getElementById('roi-requests').textContent = roi.total_requests;
    }
  } catch(e) { console.error('ROI fetch error:', e); }
}

async function handleOverride(id, action) {
  try {
    const r = await fetch(`/api/override/` + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action })
    });
    const data = await r.json();
    if (data.success) {
      showToast(`Expense ${id} successfully ${action.toLowerCase()}!`);
      loadExpenses();
    } else {
      showToast(data.error || 'Override failed', false);
    }
  } catch(err) {
    showToast('Network error', false);
  }
}

document.getElementById('expenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  const payload = {
    requester: document.getElementById('requester').value,
    amount: parseFloat(document.getElementById('amount').value),
    department_id: parseInt(document.getElementById('department_id').value),
    category: document.getElementById('category').value,
    vendor: document.getElementById('vendor').value,
    description: document.getElementById('description').value,
  };
  try {
    const r = await fetch('/api/submit', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const data = await r.json();
    if (data.success) {
      showToast(`Submitted! ${data.expense_id} — agents are processing...`);
      document.getElementById('expenseForm').reset();
      loadExpenses();
    } else {
      showToast(data.error || 'Submission failed', false);
    }
  } catch(err) {
    showToast('Network error', false);
  }
  btn.disabled = false;
  btn.textContent = 'Submit for AI Review';
});

loadExpenses();
setInterval(loadExpenses, 5000);
</script>
</body>
</html>
"""


@app.route("/")
def index():
    index_path = os.path.join(app.static_folder, "index.html")
    if os.path.exists(index_path):
        return app.send_static_file("index.html")
    return render_template_string(HTML)


@app.route("/api/submit", methods=["POST"])
def submit_expense():
    data = request.get_json()
    receipt_data = data.get("receiptData")
    receipt_url = None
    
    if receipt_data and os.getenv("CLOUDINARY_URL"):
        try:
            import cloudinary
            import cloudinary.uploader
            # Base64 string looks like: "data:image/png;base64,iVBORw0KGgo..."
            upload_result = cloudinary.uploader.upload(receipt_data)
            receipt_url = upload_result.get("secure_url")
        except Exception as e:
            print(f"[Dashboard] Failed to upload receipt to Cloudinary: {e}")

    try:
        result = db.create_expense(
            requester=data["requester"],
            amount=float(data["amount"]),
            department_id=int(data["department_id"]),
            category=data["category"],
            vendor=data["vendor"],
            description=data["description"],
            receipt_url=receipt_url
        )
        # Trigger Band message to Budget Checker
        _trigger_band(result, data, receipt_url)
        return jsonify({"success": True, "expense_id": result["expense_id"]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


def _trigger_band(expense_result: dict, data: dict, receipt_url: str = None):
    """Send a message to the Band room to kick off the agent pipeline."""
    import yaml
    from thenvoi_rest import RestClient, ChatMessageRequest, ChatMessageRequestMentionsItem
    
    room_id = os.getenv("BAND_ROOM_ID", "")
    if not room_id:
        print("[Dashboard] BAND_ROOM_ID not set — skipping Band trigger")
        return

    # Load agent config to use approval_notifier API key for sending messages
    # This avoids the "Human API requires Enterprise plan" restriction.
    try:
        import base64
        b64_config = os.getenv("AGENT_CONFIG_B64")
        if b64_config:
            config = yaml.safe_load(base64.b64decode(b64_config).decode("utf-8"))
        else:
            config_path = os.path.join(PROJECT_ROOT, "agent_config.yaml")
            with open(config_path) as f:
                config = yaml.safe_load(f)
        agent_key = config["approval_notifier"]["api_key"]
    except Exception as e:
        print(f"[Dashboard] Failed to load agent key: {e}")
        return

    message = (
        f"@Budget Checker New expense request received:\n"
        f"Expense ID  : {expense_result['expense_id']}\n"
        f"Requester   : {data['requester']}\n"
        f"Department  : {data['department_id']}\n"
        f"Category    : {data['category']}\n"
        f"Amount      : ${float(data['amount']):,.2f}\n"
        f"Vendor      : {data['vendor']}\n"
        f"Description : {data['description']}\n"
        f"Budget Left : ${expense_result['remaining_budget']:,.2f}\n"
    )
    if receipt_url:
        message += f"Receipt URL : {receipt_url}\n"
        
    message += f"Please perform budget check and hand off to @Policy Checker."
    try:
        client = RestClient(api_key=agent_key, base_url="https://app.band.ai")
        client.agent_api_messages.create_agent_chat_message(
            chat_id=room_id,
            message=ChatMessageRequest(
                content=message,
                mentions=[
                    ChatMessageRequestMentionsItem(
                        id="9364e570-dba7-44a1-ba26-561ed93a2209"
                    )
                ]
            )
        )
        print(f"[Dashboard] Band trigger: SUCCESS")
    except Exception as e:
        print(f"[Dashboard] Band trigger failed: {e}")


@app.route("/api/expenses")
def list_expenses():
    rows = db._execute("SELECT * FROM expenses ORDER BY created_at DESC LIMIT 50", fetch="all")
    return jsonify(rows)


@app.route("/api/history")
def list_history():
    rows = db._execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100", fetch="all")
    return jsonify(rows)


@app.route("/api/departments")
def list_departments():
    return jsonify(db.get_all_departments())


@app.route("/api/roi")
def calculate_roi():
    """Calculate ROI: AI automation vs manual processing."""
    expenses = db._execute("SELECT * FROM expenses", fetch="all")
    total_requests = len(expenses)
    # Manual processing: avg 5 days @ $50/hour = $2000 per request
    # AI processing: 20 seconds @ $0.01 per request
    manual_cost = total_requests * 2000
    ai_cost = total_requests * 0.01
    savings = manual_cost - ai_cost
    time_saved_hours = total_requests * 40  # 5 days each
    
    return jsonify({
        "total_requests": total_requests,
        "manual_cost_usd": manual_cost,
        "ai_cost_usd": round(ai_cost, 2),
        "total_savings_usd": savings,
        "time_saved_hours": time_saved_hours,
        "time_saved_days": round(time_saved_hours / 8, 1),
        "roi_percentage": round((savings / manual_cost * 100), 1) if manual_cost > 0 else 0
    })

@app.route("/api/debug")
def debug_env():
    import base64
    import yaml
    
    b64_err = "None"
    config = None
    try:
        b64_config = os.getenv("AGENT_CONFIG_B64")
        if b64_config:
            config = yaml.safe_load(base64.b64decode(b64_config).decode("utf-8"))
    except Exception as e:
        b64_err = str(e)
        
    return jsonify({
        "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY")),
        "CLOUDINARY_URL": bool(os.getenv("CLOUDINARY_URL")),
        "BAND_ROOM_ID": bool(os.getenv("BAND_ROOM_ID")),
        "BAND_BOT_TOKEN": bool(os.getenv("BAND_BOT_TOKEN")),
        "AGENT_CONFIG_B64": bool(os.getenv("AGENT_CONFIG_B64")),
        "B64_DECODE_ERR": b64_err,
        "CONFIG_PARSED": config is not None,
        "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
        "IS_POSTGRES": db.IS_POSTGRES
    })

@app.route("/api/test-band")
def test_band():
    import base64
    import yaml
    from thenvoi_rest import RestClient, ChatMessageRequest, ChatMessageRequestMentionsItem
    
    room_id = os.getenv("BAND_ROOM_ID", "")
    b64_config = os.getenv("AGENT_CONFIG_B64", "")
    
    try:
        config = yaml.safe_load(base64.b64decode(b64_config).decode("utf-8"))
        agent_key = config["approval_notifier"]["api_key"]
        
        client = RestClient(api_key=agent_key, base_url="https://app.band.ai")
        client.agent_api_messages.create_agent_chat_message(
            chat_id=room_id,
            message=ChatMessageRequest(
                content="Hello from Railway! If you see this, the connection is working.",
                mentions=[
                    ChatMessageRequestMentionsItem(
                        id="9364e570-dba7-44a1-ba26-561ed93a2209"
                    )
                ]
            )
        )
        return jsonify({"success": True, "message": "Triggered successfully!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e), "room_id_length": len(room_id)})

@app.route("/api/metrics")
def business_metrics():
    """Business intelligence metrics dashboard."""
    # Overall stats
    total = db._execute("SELECT COUNT(*) as count FROM expenses", fetch="one")["count"]
    approved = db._execute("SELECT COUNT(*) as count FROM expenses WHERE status='APPROVED'", fetch="one")["count"]
    rejected = db._execute("SELECT COUNT(*) as count FROM expenses WHERE status='REJECTED'", fetch="one")["count"]
    pending = db._execute("SELECT COUNT(*) as count FROM expenses WHERE status IN ('PENDING', 'ESCALATED')", fetch="one")["count"]
    
    # Approval rate by department
    dept_stats = db._execute("""
        SELECT department_name, 
               COUNT(*) as total,
               SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) as approved,
               SUM(amount) as total_amount
        FROM expenses 
        GROUP BY department_name
    """, fetch="all")
    
    # Risk distribution
    risk_dist = db._execute("""
        SELECT risk_level, COUNT(*) as count
        FROM expenses 
        WHERE risk_level IS NOT NULL
        GROUP BY risk_level
    """, fetch="all")
    
    # Top spending categories
    category_stats = db._execute("""
        SELECT category, 
               COUNT(*) as count,
               SUM(amount) as total_spending
        FROM expenses 
        WHERE status='APPROVED'
        GROUP BY category
        ORDER BY total_spending DESC
        LIMIT 5
    """, fetch="all")
    
    return jsonify({
        "overview": {
            "total": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "approval_rate": round(approved / total * 100, 1) if total > 0 else 0
        },
        "by_department": dept_stats,
        "risk_distribution": risk_dist,
        "top_categories": category_stats
    })


@app.route("/api/compliance-report")
def get_compliance_report():
    """Generate and return compliance report."""
    try:
        import compliance_report
        report_text = compliance_report.generate_compliance_report()
        return jsonify({"success": True, "report": report_text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/override/<expense_id>", methods=["POST"])
def override_expense(expense_id):
    import tools
    data = request.get_json()
    action = data.get("action")
    if action not in ["APPROVED", "REJECTED"]:
        return jsonify({"success": False, "error": "Invalid action"}), 400

    try:
        if action == "APPROVED":
            res = tools.approve_expense.func(expense_id, approved_by="Human Manager (Dashboard)", note="Approved via Dashboard Override")
        else:
            res = tools.reject_expense.func(expense_id, rejected_by="Human Manager (Dashboard)", reason="Rejected via Dashboard Override")
        
        if res.startswith("ERROR:"):
            return jsonify({"success": False, "error": res}), 400

        # Send notification to Band room
        _send_override_notification(expense_id, action)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _send_override_notification(expense_id: str, action: str):
    import yaml
    from thenvoi_rest import RestClient, ChatMessageRequest, ChatMessageRequestMentionsItem
    room_id = os.getenv("BAND_ROOM_ID", "")
    if not room_id:
        return
    try:
        config_path = os.path.join(PROJECT_ROOT, "agent_config.yaml")
        with open(config_path) as f:
            config = yaml.safe_load(f)
        agent_key = config["approval_notifier"]["api_key"]
        client = RestClient(api_key=agent_key, base_url="https://app.band.ai")
        
        expense = db.get_expense(expense_id)
        if not expense:
            return
        
        message = (
            f"[Human Override] Expense {expense_id} has been {action} by the Manager via Web Dashboard.\n"
            f"Requester: {expense['requester']}\n"
            f"Amount: ${expense['amount']:,.2f}\n"
            f"Category: {expense['category'].capitalize()}\n"
            f"Vendor: {expense['vendor']}\n"
            f"Description: {expense['description']}"
        )
        
        # Extract a valid mention ID from the room context to satisfy schema requirements
        ctx = client.agent_api_context.get_agent_chat_context(chat_id=room_id)
        mention_id = None
        for msg in ctx.data:
            metadata = getattr(msg, "metadata", None) or {}
            mentions = metadata.get("mentions", [])
            for mention in mentions:
                if mention.get("type") == "user":
                    mention_id = mention.get("id")
                    break
            if not mention_id and msg.sender_type.lower() == "user":
                mention_id = msg.sender_id
            if mention_id:
                break

        if not mention_id and ctx.data:
            mention_id = ctx.data[0].sender_id
            
        client.agent_api_messages.create_agent_chat_message(
            chat_id=room_id,
            message=ChatMessageRequest(
                content=message,
                mentions=[ChatMessageRequestMentionsItem(id=mention_id)] if mention_id else []
            )
        )
    except Exception as e:
        print(f"[Dashboard] Override notification failed: {type(e).__name__}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[Dashboard] Starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
