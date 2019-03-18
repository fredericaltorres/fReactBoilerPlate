<#
    Deployment Script to upload static web site to an Azure WebApp using the KUDU API.
    Torres Frederic 2018
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false, Position=0)]
    [string]$action         = "GetInfo", # "GetInfo"
    [string]$username       = "", # do not prefix with the webapp name
    [string]$password       = "",
    [string]$webAppName     = "",
    [string]$zipFile        = "publish.zip",
    [string]$buildFolder    = ".\build",
    [string]$buildVersion   = "",
    [string]$buildInfoJs    = ""
)

# powershell.exe ./deploy/deploy.ps1 -action Deploy  -username "" -password "" -webAppName "ftorres" -zipFile "publish.zip" -buildFolder ".\build"
# powershell.exe ./deploy/deploy.ps1 -action GetInfo -username "" -password "" -webAppName "ftorres"

import-Module ".\src\deploy\KuduMaintenance.psm1"

function createBuildInfo() {

    if($buildInfoJs -ne "") {

        Write-Color -Text "Create build info: ", $buildInfoJs  -Color DarkCyan, Cyan
        # BuildMachine : '$([System.Environment]::MachineName)',
        $text = @"
export default {
    Version : '$buildVersion',
    BuildOn : '$(get-date)',
}
"@
        $text | out-file $buildInfoJs -Encoding ascii
    }
}

# https://todo-firebase.scm.azurewebsites.net

$baseApiUrl = "https://$webAppName.scm.azurewebsites.net/api"
$outputFile = ".\out.txt"

function main() {

    cls
    Write-Color -Text "Web Site ", $webAppName ," Maintenance"  -Color DarkCyan, Cyan, DarkCyan
    Write-Color -Text "Action: ", $action  -Color DarkGreen, Green

    if($password -eq "") {
        $password = read-host -prompt "Password:(Usual as for cat but using $webAppName)"
    }
    "Connect to Azure web site '$webAppName' with username:'$username'"

    switch($action) {

        getInfo {
            Write-Color -Text "Getting deployment information ", $buildFolder -Color DarkCyan, Cyan
            $deployments = getDeploymentInfo $baseApiUrl $username $password
            "$($deployments.Length) deployments found"
        }
        deploy {
            createBuildInfo

            Write-Color -Text "Create build in folder: ", $buildFolder -Color DarkCyan, Cyan
            npm.cmd run build > $outputFile

            Write-Color -Text "Zipping folder: ", $buildFolder -Color DarkCyan, Cyan
            zipBuildOutput $buildFolder $zipFile
            
            Write-Color -Text "Deploying: ", $zipFile -Color DarkCyan, Cyan
            if(deployZip $zipFile $baseApiUrl $username $password) {
                Write-Color -Text "Deployment ", "Succeeded" -Color DarkGreen, Green
            }
            else {
                Write-Color -Text "Deployment ", "Failed" -Color DarkRed, Red
            }
            fileDelete $outputFile
        }
        createBuildInfo {            
            createBuildInfo
        }
        default {
            Write-Color -Text "Invalid action:", $action -Color DarkRed, Red
        }
    }
    Write-Color -Text "Done" -Color Yellow
}

main
