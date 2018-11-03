@echo off
cls
: password: usual as for cat but using $webAppName 
set exec=powershell.exe ./src/deploy/deploy.ps1
set deploymentUserName=jsonbuser2
set webAppName=todo-firebase
set buildVersion=1.2
%exec% deploy -username "%deploymentUserName%" -webAppName "%webAppName%" -buildInfoJs "src\deploy\BuildInfo.js" -buildVersion "%buildVersion%"
