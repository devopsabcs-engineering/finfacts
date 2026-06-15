#requires -Version 7.0
<#
.SYNOPSIS
    Configures GitHub Actions OIDC (passwordless) auth for the FinFacts teardown job.

.DESCRIPTION
    The `teardown` job in .github/workflows/azure-static-web-apps.yml authenticates to
    Azure with azure/login@v2 using OIDC — no stored password. For that to work, three
    things must exist:

      1. An Entra ID app registration (service principal) that GitHub federates into.
      2. A FEDERATED CREDENTIAL on that app whose subject matches this workflow's job.
         Because the job runs in the `production-teardown` GitHub Environment, the
         subject MUST be:
             repo:<owner>/<repo>:environment:production-teardown
         (NOT a branch/ref subject — that is the usual cause of the
          "Not all values are present. Ensure 'client-id' and 'tenant-id' are supplied"
          failure: the secrets are empty and/or the credential subject never matches.)
      3. An RBAC role assignment so the app can delete the Static Web App.

    This script creates/reuses all three, then sets the AZURE_CLIENT_ID,
    AZURE_TENANT_ID, and AZURE_SUBSCRIPTION_ID GitHub Actions secrets via the gh CLI.

    Re-running is safe (idempotent): existing app, credential, and role assignment are
    reused rather than duplicated.

.PARAMETER ResourceGroup
    Resource group that contains (or will contain) the Static Web App. The role
    assignment is scoped here so the teardown job can delete resources in it.

.PARAMETER GitHubRepo
    Target repo in 'owner/name' form. Defaults to 'devopsabcs-engineering/finfacts'.

.PARAMETER Environment
    GitHub Environment name the teardown job runs in. Must match the workflow's
    `environment:` value. Defaults to 'production-teardown'.

.PARAMETER AppName
    Display name for the Entra ID app registration. Defaults to 'finfacts-teardown-oidc'.

.PARAMETER Role
    RBAC role to grant. 'Contributor' is sufficient to delete a Static Web App.
    Defaults to 'Contributor'.

.PARAMETER ScopeLevel
    Where to assign the role: 'Subscription' (default) or 'ResourceGroup'.
    Subscription scope is required because `az staticwebapp delete` polls an
    async operation-status resource at subscription/location scope
    (Microsoft.Web/locations/.../staticSitesOperationStatuses), which a
    resource-group-scoped assignment cannot read.

.PARAMETER SubscriptionId
    Optional subscription to target. Defaults to the current az context.

.EXAMPLE
    ./infra/setup-teardown-oidc.ps1 -ResourceGroup rg-finfacts

.EXAMPLE
    ./infra/setup-teardown-oidc.ps1 -ResourceGroup rg-finfacts -Role 'Website Contributor'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ResourceGroup,

    [string]$GitHubRepo = 'devopsabcs-engineering/finfacts',

    [string]$Environment = 'production-teardown',

    [ValidateLength(2, 120)]
    [string]$AppName = 'finfacts-teardown-oidc',

    [string]$Role = 'Contributor',

    [ValidateSet('Subscription', 'ResourceGroup')]
    [string]$ScopeLevel = 'Subscription',

    [string]$SubscriptionId
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Assert-Command {
    param([string]$Command, [string]$InstallHint)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "Required command '$Command' was not found on PATH. $InstallHint"
    }
}

Write-Host '==> Checking prerequisites' -ForegroundColor Cyan
Assert-Command -Command 'az' -InstallHint 'Install the Azure CLI: https://aka.ms/installazurecli'
Assert-Command -Command 'gh' -InstallHint 'Install the GitHub CLI: https://cli.github.com'

# Confirm an active az login.
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    throw "Not logged in to Azure. Run 'az login' first."
}
if ($SubscriptionId) {
    az account set --subscription $SubscriptionId | Out-Null
    $account = az account show | ConvertFrom-Json
}
$subId = $account.id
$tenantId = $account.tenantId
Write-Host "    Subscription: $($account.name) ($subId)"
Write-Host "    Tenant:       $tenantId"

# Confirm gh is authenticated.
gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { throw "GitHub CLI is not authenticated. Run 'gh auth login' first." }

# --- 1. App registration ----------------------------------------------------
Write-Host "==> Ensuring app registration '$AppName'" -ForegroundColor Cyan
$appId = az ad app list --display-name $AppName --query '[0].appId' --output tsv
if ([string]::IsNullOrWhiteSpace($appId)) {
    $appId = az ad app create --display-name $AppName --query 'appId' --output tsv
    if ([string]::IsNullOrWhiteSpace($appId)) { throw 'Failed to create app registration.' }
    Write-Host "    Created app (appId $appId)."
}
else {
    Write-Host "    Reusing existing app (appId $appId)."
}

# Ensure a service principal exists for the app (needed for role assignment).
$spId = az ad sp list --filter "appId eq '$appId'" --query '[0].id' --output tsv
if ([string]::IsNullOrWhiteSpace($spId)) {
    $spId = az ad sp create --id $appId --query 'id' --output tsv
    Write-Host "    Created service principal (objectId $spId)."
}
else {
    Write-Host "    Reusing service principal (objectId $spId)."
}

# --- 2. Federated credentials -----------------------------------------------
# The teardown job runs in the `production-teardown` environment, so its token
# subject is an environment subject. The build_and_deploy job runs on pushes to
# main and on pull requests, so it needs branch + pull_request subjects too —
# without these, azure/login in that job fails ("No matching federated identity
# record found"). One app, multiple federated credentials.
$repoParts = $GitHubRepo.Split('/')
if ($repoParts.Count -ne 2) { throw "GitHubRepo must be 'owner/name'. Got '$GitHubRepo'." }
$repoName = $repoParts[1]

function Set-FederatedCredential {
    param(
        [Parameter(Mandatory)][string]$ClientAppId,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Subject
    )
    Write-Host "==> Ensuring federated credential '$Name'" -ForegroundColor Cyan
    Write-Host "    Subject: $Subject"
    $existing = az ad app federated-credential list --id $ClientAppId `
        --query "[?subject=='$Subject'].name | [0]" --output tsv
    if (-not [string]::IsNullOrWhiteSpace($existing)) {
        Write-Host "    Already exists ('$existing')."
        return
    }
    $body = @{
        name      = $Name
        issuer    = 'https://token.actions.githubusercontent.com'
        subject   = $Subject
        audiences = @('api://AzureADTokenExchange')
    } | ConvertTo-Json -Compress
    $tmp = New-TemporaryFile
    try {
        $body | Set-Content -Path $tmp -Encoding utf8
        az ad app federated-credential create --id $ClientAppId --parameters "@$tmp" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Failed to create federated credential '$Name'." }
    }
    finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }
    Write-Host '    Created.'
}

# Teardown: environment subject.
Set-FederatedCredential -ClientAppId $appId `
    -Name "gh-$repoName-env-$Environment" `
    -Subject "repo:$($GitHubRepo):environment:$Environment"

# Deploy: main branch push.
Set-FederatedCredential -ClientAppId $appId `
    -Name "gh-$repoName-branch-main" `
    -Subject "repo:$($GitHubRepo):ref:refs/heads/main"

# Deploy: pull requests (preview environments).
Set-FederatedCredential -ClientAppId $appId `
    -Name "gh-$repoName-pull-request" `
    -Subject "repo:$($GitHubRepo):pull_request"

# --- 3. Role assignment -----------------------------------------------------
# Subscription scope by default: `az staticwebapp delete` polls a subscription-
# level operation-status resource that a resource-group-scoped role cannot read.
if ($ScopeLevel -eq 'Subscription') {
    $scope = "/subscriptions/$subId"
}
else {
    $scope = "/subscriptions/$subId/resourceGroups/$ResourceGroup"
}
Write-Host "==> Ensuring '$Role' role assignment at $scope" -ForegroundColor Cyan
$existingAssignment = az role assignment list --assignee $appId --scope $scope `
    --query "[?roleDefinitionName=='$Role'] | [0].id" --output tsv 2>$null
if ([string]::IsNullOrWhiteSpace($existingAssignment)) {
    az role assignment create --assignee $appId --role $Role --scope $scope | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to assign '$Role' at $scope." }
    Write-Host '    Role assigned.'
}
else {
    Write-Host '    Role assignment already exists.'
}

# --- 4. GitHub Actions secrets ----------------------------------------------
# These three values are non-secret identifiers (client/tenant/subscription IDs).
# Set them via --body so no trailing newline is captured. Piping into
# `gh secret set --body -` from PowerShell appends a CR/LF, which corrupts the
# value (e.g. azure/login then fails with AADSTS90002 "Tenant not found").
Write-Host "==> Setting GitHub secrets on $GitHubRepo" -ForegroundColor Cyan
gh secret set AZURE_CLIENT_ID       --repo $GitHubRepo --body $appId.Trim()
gh secret set AZURE_TENANT_ID       --repo $GitHubRepo --body $tenantId.Trim()
gh secret set AZURE_SUBSCRIPTION_ID --repo $GitHubRepo --body $subId.Trim()
Write-Host '    AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID set.'

Write-Host ''
Write-Host '==> Done. OIDC is configured for the teardown job.' -ForegroundColor Green
Write-Host "    App ID (client):  $appId"
Write-Host "    Tenant ID:        $tenantId"
Write-Host "    Subscription ID:  $subId"
Write-Host '    Federated subjects:'
Write-Host "      - repo:$GitHubRepo:environment:$Environment"
Write-Host "      - repo:$GitHubRepo:ref:refs/heads/main"
Write-Host "      - repo:$GitHubRepo:pull_request"
Write-Host ''
Write-Host '    NOTE: Role assignments and secret propagation can take a minute.' -ForegroundColor Yellow
Write-Host "    Also confirm repo Settings > Environments > '$Environment' has required reviewers."
