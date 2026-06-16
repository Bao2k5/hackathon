@echo off
title ExpenseAI -- Band Multi-Agent System
color 0A

echo.
echo  ============================================================
echo   ExpenseAI -- Enterprise Expense Approval System
echo   Band of Agents Hackathon 2026
echo  ============================================================
echo.

cd /d "%~dp0"

echo  [1/2] Starting AI Agents (Budget, Policy, Risk, Approval)...
start "ExpenseAI -- Agents" cmd /k "cd /d %~dp0 && python main.py"

timeout /t 3 /nobreak > nul

echo  [2/2] Starting Web Dashboard...
start "ExpenseAI -- Dashboard" cmd /k "cd /d %~dp0 && python dashboard.py"

timeout /t 2 /nobreak > nul

echo.
echo  [OK] System is starting up!
echo.
echo  Dashboard  : http://localhost:5000
echo  Band Room  : https://app.band.ai
echo.
echo  QUICK TEST: Run demo scenarios
echo    python demo.py
echo.
echo  BAND CHAT examples:
echo    @Budget Checker $200 office supplies, HR dept, vendor: Staples
echo    @Budget Checker $1500 software license, Engineering dept, vendor: GitHub
echo    @Budget Checker $6000 ERP license, Engineering dept, vendor: SAP
echo.
echo  APPROVE/REJECT (type in Band Room):
echo    @Approval Notifier APPROVE EXP-XXXXXX
echo    @Approval Notifier REJECT EXP-XXXXXX budget not available
echo.
pause
