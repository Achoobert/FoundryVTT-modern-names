import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyFoundryBoot,
  foundryAccessVia
} from './record-foundry-download.js'

const FELDDY_NOISY_BOOT = `
Requesting CSRF tokens from foundryvtt.com
Successfully logged in
Installing Foundry Virtual Tabletop
Fetching presigned release URL for build 364
`

describe('classifyFoundryBoot', () => {
  it('GHA cache hit + noisy felddy logs + same zip → not site pull', () => {
    const zip = 'foundryvtt-14.364.zip'
    const result = classifyFoundryBoot({
      logs: FELDDY_NOISY_BOOT,
      zipsBefore: [zip],
      zipsAfter: [zip],
      ghaCacheHit: true
    })
    assert.equal(result.sitePull, false)
    assert.equal(result.reason, 'gha_cache_hit')
  })

  it('cache miss + new zip → site pull', () => {
    const result = classifyFoundryBoot({
      logs: '',
      zipsBefore: [],
      zipsAfter: ['foundryvtt-14.364.zip'],
      ghaCacheHit: false
    })
    assert.equal(result.sitePull, true)
    assert.equal(result.reason, 'new_zip')
  })

  it('cache miss + install log only, no new zip → not site pull', () => {
    const result = classifyFoundryBoot({
      logs: FELDDY_NOISY_BOOT,
      zipsBefore: ['foundryvtt-14.364.zip'],
      zipsAfter: ['foundryvtt-14.364.zip'],
      ghaCacheHit: false
    })
    assert.equal(result.sitePull, false)
    assert.equal(result.reason, 'none')
  })

  it('cache miss + explicit download log, no new zip → site pull via log', () => {
    const result = classifyFoundryBoot({
      logs: 'Downloading the Foundry release from CDN',
      zipsBefore: ['foundryvtt-14.364.zip'],
      zipsAfter: ['foundryvtt-14.364.zip'],
      ghaCacheHit: false
    })
    assert.equal(result.sitePull, true)
    assert.equal(result.reason, 'log')
  })
})

describe('foundryAccessVia', () => {
  it('gha_cache_hit → github-actions-cache', () => {
    assert.equal(
      foundryAccessVia({ sitePull: false, reason: 'gha_cache_hit' }),
      'github-actions-cache'
    )
  })

  it('site pull (new_zip) → foundry.com', () => {
    assert.equal(
      foundryAccessVia({ sitePull: true, reason: 'new_zip' }),
      'foundry.com'
    )
  })

  it('site pull (log) → foundry.com', () => {
    assert.equal(
      foundryAccessVia({ sitePull: true, reason: 'log' }),
      'foundry.com'
    )
  })

  it('none → local-container-cache', () => {
    assert.equal(
      foundryAccessVia({ sitePull: false, reason: 'none' }),
      'local-container-cache'
    )
  })
})
