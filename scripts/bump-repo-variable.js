import { execFileSync } from 'node:child_process'
import { REPO_ROOT } from './fvtt-paths.js'
import {
  VAR_FOUNDRY_GHA_CACHE,
  VAR_FOUNDRY_GHA_CACHE_LEGACY
} from './foundry-stats-constants.js'

function resolveRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY
  }
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    }).trim()
    const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
    if (m) {
      return `${m[1]}/${m[2]}`
    }
  } catch {
    /* no git remote */
  }
  return null
}

function authToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
}

async function getVariableViaApi(repo, name) {
  const token = authToken()
  if (!token) {
    return null
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/variables/${encodeURIComponent(name)}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GET variable ${name}: ${res.status} ${body}`)
  }
  const data = await res.json()
  return data.value
}

async function setVariableViaApi(repo, name, value) {
  const token = authToken()
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN required to set repository variables')
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/variables/${encodeURIComponent(name)}`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, value: String(value) })
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PATCH variable ${name}: ${res.status} ${body}`)
  }
}

function getVariableViaGh(repo, name) {
  try {
    return execFileSync('gh', ['variable', 'get', name, '-R', repo], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
  } catch {
    return null
  }
}

function setVariableViaGh(repo, name, value) {
  execFileSync('gh', ['variable', 'set', name, '--body', String(value), '-R', repo], {
    stdio: 'inherit'
  })
}

export async function getRepoVariable(name) {
  const repo = resolveRepoSlug()
  if (!repo) {
    return null
  }
  const token = authToken()
  if (token) {
    const api = await getVariableViaApi(repo, name)
    if (api != null) {
      return api
    }
  }
  return getVariableViaGh(repo, name)
}

export async function setRepoVariable(name, value) {
  const repo = resolveRepoSlug()
  if (!repo) {
    throw new Error('Could not resolve GitHub repository (GITHUB_REPOSITORY or git origin)')
  }
  const token = authToken()
  if (token) {
    await setVariableViaApi(repo, name, value)
    return
  }
  setVariableViaGh(repo, name, value)
}

export async function incrementRepoVariable(name, delta = 1) {
  const current = Number(await getRepoVariable(name)) || 0
  const next = current + delta
  await setRepoVariable(name, next)
  return next
}

/** Resolve GHA cache counter variable (correct name or legacy typo). */
export async function resolveGhaCacheVariableName() {
  const repo = resolveRepoSlug()
  if (!repo) {
    return VAR_FOUNDRY_GHA_CACHE
  }
  const token = authToken()
  if (token) {
    const primary = await getVariableViaApi(repo, VAR_FOUNDRY_GHA_CACHE)
    if (primary != null) {
      return VAR_FOUNDRY_GHA_CACHE
    }
    const legacy = await getVariableViaApi(repo, VAR_FOUNDRY_GHA_CACHE_LEGACY)
    if (legacy != null) {
      return VAR_FOUNDRY_GHA_CACHE_LEGACY
    }
  }
  if (getVariableViaGh(repo, VAR_FOUNDRY_GHA_CACHE) != null) {
    return VAR_FOUNDRY_GHA_CACHE
  }
  if (getVariableViaGh(repo, VAR_FOUNDRY_GHA_CACHE_LEGACY) != null) {
    return VAR_FOUNDRY_GHA_CACHE_LEGACY
  }
  return VAR_FOUNDRY_GHA_CACHE
}

export function shouldBumpRepoCounters() {
  if (process.env.FOUNDRY_STATS_SKIP === '1') {
    return false
  }
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    return false
  }
  if (process.env.GITHUB_REF) {
    return (
      process.env.GITHUB_REF === 'refs/heads/main' ||
      process.env.GITHUB_REF === 'refs/heads/master'
    )
  }
  return process.env.RECORD_FOUNDRY_STATS === '1'
}
