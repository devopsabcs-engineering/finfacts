#requires -Version 7.0
<#
.SYNOPSIS
    Provisions the FinFacts Azure Static Web App from Bicep and deploys the built site.

.DESCRIPTION
    End-to-end PowerShell deployment for the FinFacts shark-education site:

      1. Verifies the Azure CLI is installed and you are logged in.
      2. Creates (or reuses) the target resource group.
      3. Deploys infra/main.bicep to provision the Static Web App (Free tier by default).
      4. Reads the deployment token (a secret) from the new resource.
      5. Optionally builds the Astro site (npm ci + npm run build).
      6. Deploys the contents of ./dist to the Static Web App using the Azure SWA CLI.
      7. Optionally stores the deployment token as the AZURE_STATIC_WEB_APPS_API_TOKEN
         GitHub Actions secret (via the gh CLI) so the CI/CD workflow can deploy too.

    The deployment token is never written to the console or to disk.

.PARAMETER ResourceGroup
    Resource group to deploy into. Created if it does not exist.

.PARAMETER Location
    Azure region for the resource group and Static Web App metadata.
    Must be a Static Web Apps-supported region.

.PARAMETER Name
    Name of the Static Web App resource.

.PARAMETER Sku
    Hosting plan SKU: Free (default) or Standard.

.PARAMETER SubscriptionId
    Optional subscription to target. Defaults to the current az context.

.PARAMETER SkipBuild
    Skip `npm ci` / `npm run build` and deploy the existing ./dist folder as-is.

.PARAMETER SkipContentDeploy
    Provision infrastructure only; do not upload site content.

.PARAMETER SetGitHubSecret
    Store the deployment token as the AZURE_STATIC_WEB_APPS_API_TOKEN secret on the
    given GitHub repository using the gh CLI (requires gh to be installed and authed).

.PARAMETER GitHubRepo
    Target repo for -SetGitHubSecret, in 'owner/name' form.
    Defaults to 'devopsabcs-engineering/finfacts'.

.EXAMPLE
    ./infra/deploy-swa.ps1 -ResourceGroup rg-finfacts

.EXAMPLE
    ./infra/deploy-swa.ps1 -ResourceGroup rg-finfacts -Location westeurope -Sku Standard

.EXAMPLE
    # Provision and wire the GitHub Actions secret, but let CI deploy the content.
    ./infra/deploy-swa.ps1 -ResourceGroup rg-finfacts -SkipContentDeploy -SetGitHubSecret
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ResourceGroup,

    [ValidateSet('westus2', 'centralus', 'eastus2', 'westeurope', 'eastasia')]
    [string]$Location = 'eastus2',

    [ValidateLength(2, 60)]
    [string]$Name = 'finfacts',

    [ValidateSet('Free', 'Standard')]
    [string]$Sku = 'Free',

    [string]$SubscriptionId,

    [switch]$SkipBuild,

    [switch]$SkipContentDeploy,

    [switch]$SetGitHubSecret,

    [string]$GitHubRepo = 'devopsabcs-engineering/finfacts'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Resolve repository root from this script's location so the script works from any CWD.
$repoRoot = Split-Path -Parent $PSScriptRoot
$bicepFile = Join-Path $PSScriptRoot 'main.bicep'
$distDir = Join-Path $repoRoot 'dist'

function Assert-Command {
    param([string]$Command, [string]$InstallHint)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Required command '$Command' was not found on PATH. $InstallHint"
    }
}

Write-Host '==> Checking prerequisites' -ForegroundColor Cyan
Assert-Command -Command 'az' -InstallHint 'Install the Azure CLI: https://aka.ms/installazurecli'

# Confirm an active az login.
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    throw "Not logged in to Azure. Run 'az login' (and optionally 'az account set --subscription <id>') first."
}

if ($SubscriptionId) {
    Write-Host "==> Setting subscription to $SubscriptionId" -ForegroundColor Cyan
    az account set --subscription $SubscriptionId | Out-Null
    $account = az account show | ConvertFrom-Json
}
Write-Host "    Subscription: $($account.name) ($($account.id))"

# --- 1. Resource group ------------------------------------------------------
Write-Host "==> Ensuring resource group '$ResourceGroup' in '$Location'" -ForegroundColor Cyan
$rgExists = (az group exists --name $ResourceGroup) -eq 'true'
if (-not $rgExists) {
    az group create --name $ResourceGroup --location $Location | Out-Null
    Write-Host "    Created resource group '$ResourceGroup'."
}
else {
    Write-Host "    Resource group '$ResourceGroup' already exists."
}

# --- 2. Bicep deployment ----------------------------------------------------
$deploymentName = "finfacts-swa-$([DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))"
Write-Host "==> Deploying Bicep ($deploymentName)" -ForegroundColor Cyan
$deployJson = az deployment group create `
    --resource-group $ResourceGroup `
    --name $deploymentName `
    --template-file $bicepFile `
    --parameters name=$Name location=$Location sku=$Sku `
    --query 'properties.outputs' `
    --output json
if ($LASTEXITCODE -ne 0) { throw 'Bicep deployment failed.' }

$outputs = $deployJson | ConvertFrom-Json
$staticSiteName = $outputs.staticSiteName.value
$defaultHostname = $outputs.defaultHostname.value
Write-Host "    Static Web App: $staticSiteName"
Write-Host "    Default URL:    https://$defaultHostname"

# --- 3. Deployment token (secret) ------------------------------------------
Write-Host '==> Retrieving deployment token' -ForegroundColor Cyan
$deploymentToken = az staticwebapp secrets list `
    --name $staticSiteName `
    --resource-group $ResourceGroup `
    --query 'properties.apiKey' `
    --output tsv
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($deploymentToken)) {
    throw 'Failed to retrieve the Static Web App deployment token.'
}
Write-Host '    Token retrieved (hidden).'

# --- 4. Optional: store the token as a GitHub Actions secret ----------------
if ($SetGitHubSecret) {
    Write-Host "==> Setting GitHub secret AZURE_STATIC_WEB_APPS_API_TOKEN on $GitHubRepo" -ForegroundColor Cyan
    Assert-Command -Command 'gh' -InstallHint 'Install the GitHub CLI: https://cli.github.com'
    # Pipe via stdin so the token is never passed as a visible argument.
    $deploymentToken | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo $GitHubRepo --body -
    if ($LASTEXITCODE -ne 0) { throw 'Failed to set the GitHub secret. Is gh authenticated (gh auth status)?' }
    Write-Host '    Secret set.'
}

# --- 5. Build the site ------------------------------------------------------
if (-not $SkipContentDeploy) {
    if (-not $SkipBuild) {
        Write-Host '==> Building the site (npm ci + npm run build)' -ForegroundColor Cyan
        Assert-Command -Command 'npm' -InstallHint 'Install Node.js 20+: https://nodejs.org'
        Push-Location $repoRoot
        try {
            npm ci
            if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
            npm run build
            if ($LASTEXITCODE -ne 0) { throw 'npm run build failed.' }
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Host '==> Skipping build (-SkipBuild); deploying existing ./dist' -ForegroundColor Yellow
    }

    if (-not (Test-Path $distDir)) {
        throw "Build output '$distDir' not found. Run a build first or omit -SkipBuild."
    }

    # --- 6. Deploy content via the Azure SWA CLI ----------------------------
    Write-Host '==> Deploying ./dist to the Static Web App (production environment)' -ForegroundColor Cyan
    # npx runs the SWA CLI without a global install; token via env so it is not logged.
    $env:SWA_CLI_DEPLOYMENT_TOKEN = $deploymentToken
    try {
        npx --yes @azure/static-web-apps-cli deploy $distDir `
            --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN `
            --env production
        if ($LASTEXITCODE -ne 0) { throw 'SWA content deployment failed.' }
    }
    finally {
        Remove-Item Env:SWA_CLI_DEPLOYMENT_TOKEN -ErrorAction SilentlyContinue
    }
}
else {
    Write-Host '==> Skipping content deploy (-SkipContentDeploy); infrastructure only.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Write-Host "Site URL: https://$defaultHostname"
if (-not $SetGitHubSecret) {
    Write-Host ''
    Write-Host 'Next: add the deployment token as the GitHub secret so CI can deploy:' -ForegroundColor Yellow
    Write-Host "  ./infra/deploy-swa.ps1 -ResourceGroup $ResourceGroup -SkipBuild -SkipContentDeploy -SetGitHubSecret"
    Write-Host '  (or copy it from: Azure Portal > Static Web App > Manage deployment token)'
}
