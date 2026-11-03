/* 将 Claude Code 会话 JSONL 导出为可读的 Markdown（仅文本 + 工具调用摘要） */
const fs = require('fs')
const path = require('path')

const SRC = process.argv[2]
const DEST = process.argv[3]

const lines = fs.readFileSync(SRC, 'utf8').split('\n').filter(Boolean)
const out = []
out.push('# 家庭回忆录项目 · 开发会话记录')
out.push('')
out.push(`> 导出时间：2026-11-04 00:05 ｜ 源文件：session-2026-11-03.jsonl（原始 JSONL 完整记录）`)
out.push('')

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((b) => {
      if (b.type === 'text') return b.text
      if (b.type === 'tool_use') {
        const input = JSON.stringify(b.input || {})
        return `\`[工具] ${b.name}\` ${input.length > 160 ? input.slice(0, 160) + '…' : input}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

let count = 0
for (const line of lines) {
  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }
  const msg = entry.message
  if (!msg) continue
  const role = msg.role || entry.type
  if (role !== 'user' && role !== 'assistant') continue

  let text = textOf(msg.content)
  if (!text || !text.trim()) continue
  // 跳过系统提示类内容
  if (text.includes('<system-reminder>') && text.trim().length < 400) continue
  if (text.trim().startsWith('Caveat:') || text.includes('local-command')) continue

  const who = role === 'user' ? '🧑 用户' : '🤖 Claude'
  out.push(`## ${who} · ${fmtTime(entry.timestamp)}`)
  out.push('')
  out.push(text.trim())
  out.push('')
  count++
}

fs.writeFileSync(DEST, out.join('\n'), 'utf8')
console.log(`exported ${count} messages -> ${path.basename(DEST)} (${(fs.statSync(DEST).size / 1024).toFixed(0)} KB)`)
