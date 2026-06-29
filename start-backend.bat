@echo off
cd /d "%~dp0backend"
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Starting OlimFood Backend on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
