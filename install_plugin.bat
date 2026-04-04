@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa"
echo Instalando @capacitor-firebase/authentication...
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install @capacitor-firebase/authentication > install_plugin.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> install_plugin.log
echo DONE
