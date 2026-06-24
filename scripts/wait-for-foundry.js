import developmentOptions from '../fvtt.config.js'

const baseURL = developmentOptions.baseURL ?? 'http://localhost:30000'
const deadline = Date.now() + 120_000

while (Date.now() < deadline) {
  try {
    const res = await fetch(baseURL, { redirect: 'follow' })
    if (res.ok || res.status === 302) {
      console.log('Foundry is up:', baseURL)
      process.exit(0)
    }
  } catch {
    //
  }
  await new Promise((r) => setTimeout(r, 2000))
}

console.error('Timed out waiting for Foundry at', baseURL)
process.exit(1)
