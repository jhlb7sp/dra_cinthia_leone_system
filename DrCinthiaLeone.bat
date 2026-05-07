@echo off
cd "C:\Users\jhb7s\OneDrive\Desktop\PRJ_CDC\PRJ-CONSULTORIO\backend"
start /b cmd /c "npm start"
timeout /t 3
start http://localhost:3000/