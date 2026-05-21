@echo off
echo.
echo   ======================================
echo     Kumo - Chrome Extension Quick Load
echo   ======================================
echo.

REM Check if dist exists
if not exist "%~dp0..\dist\manifest.json" (
    echo   [ERROR] Extension not built yet.
    echo   Run: npm run build
    echo.
    pause
    exit /b 1
)

REM Find Chrome
set CHROME=
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe

if "%CHROME%"=="" (
    echo   [ERROR] Chrome not found.
    echo   Install Chrome or add it to PATH.
    pause
    exit /b 1
)

REM Get absolute path to dist
for %%i in ("%~dp0..\dist") do set DIST_PATH=%%~fi

echo   Chrome:  %CHROME%
echo   Dist:    %DIST_PATH%
echo.
echo   Opening Chrome with Kumo loaded...
echo   Also opening the test page...
echo.

REM Start the test server in background
start "Kumo-Test-Server" cmd /c "node test/server.js"

REM Wait a bit for server to start
timeout /t 2 /nobreak >nul

REM Open Chrome: load extension + open test page
start "" "%CHROME%" --load-extension="%DIST_PATH%" --new-window "http://localhost:3456"

echo.
echo   ======================================
echo   Chrome launched!
echo.
echo   Test instructions:
echo   1. The extension should already be loaded
echo   2. Check chrome://extensions if not
echo   3. Furigana should appear on the test page
echo   4. Hover words to see popup definitions
echo   ======================================
echo.
pause
