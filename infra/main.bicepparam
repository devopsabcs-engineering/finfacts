// Default parameters for infra/main.bicep.
// Override any of these on the command line or by editing this file.
using './main.bicep'

param name = 'finfacts'
param location = 'eastus2'
param sku = 'Free'
param tags = {
  application: 'finfacts'
  workload: 'shark-education-site'
  environment: 'production'
}
