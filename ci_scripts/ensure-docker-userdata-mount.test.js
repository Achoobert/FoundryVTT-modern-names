import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as path from 'node:path'
import {
  findDataMountSource,
  mountsMatchExpected
} from './ensure-docker-userdata-mount.js'

describe('findDataMountSource', () => {
  it('returns Source for /data destination', () => {
    const mounts = [
      { Source: '/host/cache', Destination: '/container_cache' },
      { Source: '/host/foundrydata', Destination: '/data' }
    ]
    assert.equal(findDataMountSource(mounts), path.resolve('/host/foundrydata'))
  })

  it('returns null when /data missing', () => {
    assert.equal(findDataMountSource([{ Source: '/x', Destination: '/y' }]), null)
    assert.equal(findDataMountSource(null), null)
  })
})

describe('mountsMatchExpected', () => {
  it('matches resolved paths', () => {
    assert.equal(
      mountsMatchExpected('/tmp/foundrydata', '/tmp/foundrydata'),
      true
    )
  })

  it('rejects mismatch', () => {
    assert.equal(
      mountsMatchExpected('/docker/foundrydata', '/repo/foundrydata'),
      false
    )
  })

  it('rejects missing actual', () => {
    assert.equal(mountsMatchExpected(null, '/repo/foundrydata'), false)
  })
})
