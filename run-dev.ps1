# Change to script directory
Set-Location $PSScriptRoot

# Change to the directory where the script is located
Set-Location $PSScriptRoot

# Setup environment variables for VS 2022 BuildTools
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207"
$sdkPath = "C:\Program Files (x86)\Windows Kits\10"
$sdkVer = "10.0.22621.0"

$env:PATH = "$vsPath\bin\Hostx64\x64;" + $env:PATH
$env:INCLUDE = "$vsPath\include;$sdkPath\Include\$sdkVer\um;$sdkPath\Include\$sdkVer\shared;$sdkPath\Include\$sdkVer\ucrt"
$env:LIB = "$vsPath\lib\x64;$sdkPath\Lib\$sdkVer\um\x64;$sdkPath\Lib\$sdkVer\ucrt\x64"

# Set these to help Rust find the right tools
$env:VCINSTALLDIR = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC"
$env:WindowsSdkDir = "$sdkPath\"
$env:WindowsSDKVersion = "$sdkVer\"

# Clear default Tauri port (1420) if something is hanging there
Write-Host "Cleaning up port 1420..."
$portProcess = Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcess) {
    Write-Host "Killing process $portProcess on port 1420"
    Stop-Process -Id $portProcess -Force
}

Write-Host "Starting Tauri dev with VS 2022 BuildTools environment..."
npm run tauri dev
