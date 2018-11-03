<#
    Deployment Script to upload static web site to an Azure WebApp using the KUDU API.
    Torres Frederic 2018

KUDU API
    https://docs.microsoft.com/en-us/azure/app-service/app-service-deploy-zip
    https://github.com/projectkudu/kudu/wiki/Deploying-from-a-zip-file
    https://github.com/projectkudu/kudu/wiki/REST-API#zip
    https://github.com/projectkudu/kudu/wiki/REST-API#user-content-zip-deployment
    https://ftorres.scm.azurewebsites.net/api/deployments
    https://ftorres.scm.azurewebsites.net/api/settings    
    # basic auth with Invoke-WebRequest: https://stackoverflow.com/a/27951845/7532
#>

$_userAgent = "powershell/1.0"

function fileExists($fileName) {

    return (Test-Path $fileName -PathType Leaf)
}

function fileDelete($fileName) {

    if(fileExists($fileName)) {
        Remove-Item $fileName
    }
}

function getUrlHeader($username, $password) {

    $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username, $password)))
    $headers = @{Authorization=("Basic {0}" -f $base64AuthInfo)}
    return $headers
}

function zipBuildOutput($buildFolder, $zipFile) {

    fileDelete $zipFile
    Compress-Archive -Path "$buildFolder\*" -DestinationPath $zipFile
}

function ExecInvoke-RestMethod
{
    param ([parameter(Mandatory=$true)][ScriptBlock]$ScriptBlock)
    try {
        &$ScriptBlock
        return $true
    } catch {
        Write-Color -Text "Invoke-RestMethod status:", $_.Exception.Response.StatusCode.value__, " - ", $_.Exception.Response.StatusDescription -Color DarkRed, Red, DarkRed, Red
    }
    return $false
}

function deployZip($zipFile, $baseApiUrl, $username, $password) {

    $headers = getUrlHeader $username $password
    $apiUrl  = "$baseApiUrl/zipdeploy"

    $r = ExecInvoke-RestMethod {
        Invoke-RestMethod -Uri $apiUrl -Headers $headers -UserAgent $_userAgent -Method POST -InFile $zipFile -ContentType "multipart/form-data"    
    }
    if($r -eq $false) {
        #Write-Color -Text "Url: ", $apiUrl -Color DarkRed, Red
    }
    return $r
}

function getDeploymentInfo($baseApiUrl, $username, $password) {

    $headers = getUrlHeader $username $password
    $apiUrl  = "$baseApiUrl/deployments"
    $json    = Invoke-RestMethod -Uri $apiUrl -Headers $headers -UserAgent $_userAgent -Method GET
    return $json
}

# See https://stackoverflow.com/questions/2688547/multiple-foreground-colors-in-powershell-in-one-command
# https://evotec.xyz/powershell-how-to-format-powershell-write-host-with-multiple-colors
function Write-Color([String[]]$Text, [ConsoleColor[]]$Color = "White", [int]$StartTab = 0, [int] $LinesBefore = 0,[int] $LinesAfter = 0, [string] $LogFile = "", $TimeFormat = "yyyy-MM-dd HH:mm:ss") {
    # version 0.2
    # - added logging to file
    # version 0.1
    # - first draft
    # 
    # Notes:
    # - TimeFormat https://msdn.microsoft.com/en-us/library/8kb3ddd4.aspx

    $DefaultColor = $Color[0]
    if ($LinesBefore -ne 0) {  for ($i = 0; $i -lt $LinesBefore; $i++) { Write-Host "`n" -NoNewline } } # Add empty line before
    if ($StartTab -ne 0) {  for ($i = 0; $i -lt $StartTab; $i++) { Write-Host "`t" -NoNewLine } }  # Add TABS before text
    if ($Color.Count -ge $Text.Count) {
        for ($i = 0; $i -lt $Text.Length; $i++) { Write-Host $Text[$i] -ForegroundColor $Color[$i] -NoNewLine } 
    } else {
        for ($i = 0; $i -lt $Color.Length ; $i++) { Write-Host $Text[$i] -ForegroundColor $Color[$i] -NoNewLine }
        for ($i = $Color.Length; $i -lt $Text.Length; $i++) { Write-Host $Text[$i] -ForegroundColor $DefaultColor -NoNewLine }
    }
    Write-Host
    if ($LinesAfter -ne 0) {  for ($i = 0; $i -lt $LinesAfter; $i++) { Write-Host "`n" } }  # Add empty line after
    if ($LogFile -ne "") {
        $TextToFile = ""
        for ($i = 0; $i -lt $Text.Length; $i++) {
            $TextToFile += $Text[$i]
        }
        Write-Output "[$([datetime]::Now.ToString($TimeFormat))]$TextToFile" | Out-File $LogFile -Encoding unicode -Append
    }
}

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export-modulemember -function getDeploymentInfo
export-modulemember -function deployZip
export-modulemember -function zipBuildOutput 
export-modulemember -function Write-Color
export-modulemember -function fileDelete