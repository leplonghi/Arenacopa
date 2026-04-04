@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa"

echo [1/3] Buildando assets web...
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" build > build_web.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO no vite build >> build_web.log
    exit /b 1
)
echo BUILD WEB OK >> build_web.log

echo [2/3] Sincronizando Capacitor...
"C:\Program Files\nodejs\node.exe" "node_modules\@capacitor\cli\bin\capacitor" sync android >> build_web.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO no cap sync >> build_web.log
    exit /b 1
)
echo CAP SYNC OK >> build_web.log

echo [3/3] Gerando AAB...
cd /d "C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\android"
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
call gradlew.bat bundleRelease > build_aab.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> build_aab.log
