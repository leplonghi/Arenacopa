@echo off
cd /d "C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\android"
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
call gradlew.bat bundleRelease > build_out3.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> build_out3.log
