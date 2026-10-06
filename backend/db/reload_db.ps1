# PowerShell script to reload the database
Write-Host "Reloading LMS Database..." -ForegroundColor Cyan

$sqlPath = "C:\Samrudhi_college\PES stuff\Year 3\Sem 5\SE\Project\project_PESU_RR_AIML_B_P12_Automated_Leave_Management_System_LeaveItToUs\backend\db\sql"

# Prompt for MySQL password
$mysqlPassword = Read-Host "Enter MySQL root password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "`nDropping and recreating database..." -ForegroundColor Yellow
mysql -u root -p"$password" -e "DROP DATABASE IF EXISTS lms; CREATE DATABASE lms;"

Write-Host "Loading schema..." -ForegroundColor Yellow
Get-Content "$sqlPath\LMS_schema.sql" | mysql -u root -p"$password" lms

Write-Host "Loading sample data..." -ForegroundColor Yellow
Get-Content "$sqlPath\Sample_data_lms.sql" | mysql -u root -p"$password" lms

Write-Host "`nDatabase reloaded successfully!" -ForegroundColor Green
Write-Host "`nVerifying Ankit's account..." -ForegroundColor Cyan
mysql -u root -p"$password" lms -e "SELECT EmpID, FirstName, LastName, Email, Role FROM Employee WHERE Email='ankit.gupta@lms.com';"

Write-Host "`nYou can now login with:" -ForegroundColor Green
Write-Host "Email: ankit.gupta@lms.com"
Write-Host "Password: password123"
