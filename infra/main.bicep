// FinFacts — Azure Static Web App (shark education site).
//
// Provisions a single Microsoft.Web/staticSites resource intended for
// token-based deployment from GitHub Actions (Azure/static-web-apps-deploy)
// or the Azure SWA CLI. No source repository is wired into the resource here,
// so the deployment token is the integration point — retrieve it after
// deployment and either store it as the AZURE_STATIC_WEB_APPS_API_TOKEN GitHub
// secret or pass it to `swa deploy`.
//
// Deploy at resource-group scope, e.g. via infra/deploy-swa.ps1.

targetScope = 'resourceGroup'

@description('Name of the Static Web App resource.')
@minLength(2)
@maxLength(60)
param name string = 'finfacts'

@description('Azure region for the Static Web App. Must be a region where Static Web Apps metadata is hosted.')
@allowed([
  'westus2'
  'centralus'
  'eastus2'
  'westeurope'
  'eastasia'
])
param location string = 'eastus2'

@description('Hosting plan SKU. Free is sufficient for this static site; Standard adds custom auth, SLA, and more.')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Tags applied to the Static Web App.')
param tags object = {
  application: 'finfacts'
  workload: 'shark-education-site'
}

resource staticSite 'Microsoft.Web/staticSites@2024-04-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Allow the committed staticwebapp.config.json to drive routes/headers.
    allowConfigFileUpdates: true
    // Enable per-PR preview (staging) environments to match the GitHub workflow.
    stagingEnvironmentPolicy: 'Enabled'
    // Public site, no enterprise-grade edge required for the Free tier.
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

@description('The Static Web App resource name.')
output staticSiteName string = staticSite.name

@description('The default *.azurestaticapps.net hostname the site is served from.')
output defaultHostname string = staticSite.properties.defaultHostname

@description('Fully qualified resource ID of the Static Web App.')
output resourceId string = staticSite.id
