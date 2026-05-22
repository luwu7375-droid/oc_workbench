/**
 * 打包前运行：从 .env.local（或 .env）读取敏感配置，AES-256-GCM 加密后写入 resources/config.enc
 * 用法：node scripts/encrypt-config.js
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// 与 electron/main.js 保持一致的加密 key（32 字节 hex）
const ENCRYPTION_KEY = Buffer.from(
  process.env.CONFIG_ENCRYPTION_KEY || 'oc-workbench-default-key-32bytes!!',
  'utf8'
).subarray(0, 32)

// 需要打包进去的环境变量
const VARS_TO_PACK = [
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'BRIDGE_USER_ID',
  'BRIDGE_TOKEN',
]

// 读取 .env.local 或 .env
function loadEnvFile() {
  const candidates = ['.env.local', '.env']
  for (const f of candidates) {
    const p = path.join(__dirname, '..', f)
    if (fs.existsSync(p)) {
      console.log(`Reading from ${f}`)
      return fs.readFileSync(p, 'utf8')
    }
  }
  throw new Error('No .env.local or .env file found')
}

function parseEnv(content) {
  const result = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    result[key] = val
  }
  return result
}

function encrypt(plaintext, key) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // 格式：iv(12) + authTag(16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

const envContent = loadEnvFile()
const allVars = parseEnv(envContent)

const config = {}
for (const key of VARS_TO_PACK) {
  if (allVars[key]) {
    config[key] = allVars[key]
  } else {
    console.warn(`Warning: ${key} not found in env file`)
  }
}

if (Object.keys(config).length === 0) {
  console.error('No variables to pack. Check your .env.local file.')
  process.exit(1)
}

const plaintext = JSON.stringify(config)
const encrypted = encrypt(plaintext, ENCRYPTION_KEY)

// 输出到 resources/ 目录（electron-builder 会把它打包进 app）
const outDir = path.join(__dirname, '..', 'resources')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'config.enc')
fs.writeFileSync(outPath, encrypted, 'utf8')

console.log(`Encrypted config written to resources/config.enc`)
console.log(`Packed variables: ${Object.keys(config).join(', ')}`)
