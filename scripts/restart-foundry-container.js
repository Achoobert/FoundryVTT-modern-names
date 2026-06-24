import { execFileSync } from 'node:child_process'

const CONTAINER = 'foundry-modern-names-test'

try {
  execFileSync('docker', ['inspect', CONTAINER], { stdio: 'ignore' })
} catch {
  console.log(`No Docker container "${CONTAINER}" — skip restart (relaunch world after install-quench if modules changed).`)
  process.exit(0)
}

console.log('Restarting', CONTAINER, 'so world.json module list reloads…')
execFileSync('docker', ['restart', CONTAINER], { stdio: 'inherit' })
