/**
 * Copy to fvtt.config.js and set userDataPath to your Foundry user data folder
 * (Foundry → Configure Settings → User Data Path).
 *
 * Examples:
 *   Windows: %localappdata%/FoundryVTT
 *   macOS:   ~/Library/Application Support/FoundryVTT
 *   Linux:   /home/$USER/.local/share/FoundryVTT
 *
 * Then: npm run watch  (dev, copies to Data/modules/modern-names)
 *       npm run build   (production, same destination)
 */

const developmentOptions = {
  userDataPath: '/Users/YOUR_USERNAME/foundrydata',
  baseURL: 'http://localhost:30000',
  /** World title on Foundry setup screen — Cypress launches this for Quench E2E */
  testWorldName: 'modern-names-test',
  /** Optional Foundry admin password if /auth is shown */
  adminPassword: '',
  /** Quench release manifest; download URL taken from manifest unless quenchDownloadUrl is set */
  quenchManifestUrl: 'https://github.com/Ethaks/FVTT-Quench/releases/download/v0.10.0/module.json',
  /** Test world game system; downloaded into Data/systems/ if missing */
  testSystemManifestUrl:
    'https://github.com/deltagreen-foundryvtt/delta-green-foundry-vtt-system/releases/download/v1.7.0/system.json'
}

export default developmentOptions
