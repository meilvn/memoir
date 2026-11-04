/* eslint-disable */
/**
 * 测试数据种子脚本
 * ------------------------------------------------------------------
 * 从免费图源下载图片/视频，按指定日期写入 uploads/ + thumbnails/，
 * 并向 SQLite 的 media 表插入记录（复刻 MediaService.upload 的落盘结构）。
 *
 * 图源：Lorem Picsum (https://picsum.photos)      — 免费图片
 *       test-videos.co.uk                          — 免费测试视频
 *
 * 用法：  npm run seed
 * 注意：  会先清空 media 表及 uploads/、thumbnails/ 下已有文件（测试数据可重新生成）
 */
const { existsSync, mkdirSync, rmSync, copyFileSync, statSync, readdirSync, writeFileSync } = require('fs')
const { join } = require('path')
const { randomUUID } = require('crypto')
const { execFileSync } = require('child_process')
const Database = require('better-sqlite3')
const sharp = require('sharp')

const ROOT = process.cwd()
const UPLOAD_DIR = join(ROOT, 'uploads')
const THUMB_DIR = join(ROOT, 'thumbnails')
const CACHE_DIR = join(ROOT, '.seed-cache')
const DB_PATH = join(ROOT, process.env.DATABASE_PATH || './family_memoir.db')

/* ---------------- 数据规划：60 张照片 + 8 个视频，跨度 2016-2026 ---------------- */

// 54 个基准日期（每年 4-5 个，覆盖全年不同月份）
const DATES = [
  ['2016', '02', '14'], ['2016', '05', '01'], ['2016', '08', '20'], ['2016', '10', '03'], ['2016', '12', '25'],
  ['2017', '01', '28'], ['2017', '04', '05'], ['2017', '07', '16'], ['2017', '09', '30'], ['2017', '11', '11'],
  ['2018', '03', '08'], ['2018', '06', '01'], ['2018', '06', '18'], ['2018', '10', '01'], ['2018', '12', '31'],
  ['2019', '02', '05'], ['2019', '05', '12'], ['2019', '08', '08'], ['2019', '11', '03'], ['2019', '11', '28'],
  ['2020', '01', '01'], ['2020', '04', '04'], ['2020', '07', '25'], ['2020', '10', '06'], ['2020', '11', '04'],
  ['2021', '02', '12'], ['2021', '05', '01'], ['2021', '09', '21'], ['2021', '11', '03'], ['2021', '12', '24'],
  ['2022', '02', '01'], ['2022', '06', '03'], ['2022', '08', '14'], ['2022', '11', '04'], ['2022', '11', '11'],
  ['2023', '01', '22'], ['2023', '05', '03'], ['2023', '07', '30'], ['2023', '10', '23'], ['2023', '11', '03'],
  ['2024', '02', '10'], ['2024', '04', '04'], ['2024', '06', '16'], ['2024', '09', '17'], ['2024', '11', '04'],
  ['2025', '01', '29'], ['2025', '05', '31'], ['2025', '08', '09'], ['2025', '11', '02'], ['2025', '11', '03'],
  ['2026', '01', '01'], ['2026', '03', '15'], ['2026', '06', '01'], ['2026', '09', '10'], ['2026', '10', '28'],
]

// 视频放在这 8 个日期上（与照片共用日期，模拟"同一天既有照片又有视频"）
const VIDEO_DATES = [
  '2016/05/01', '2017/09/30', '2018/10/01', '2019/08/08',
  '2020/07/25', '2021/09/21', '2023/10/23', '2025/08/09',
]

// 6 个日期额外加一张照片（让部分日期有 2 张照片）
const EXTRA_PHOTO_DATES = ['2016/12/25', '2017/11/11', '2018/12/31', '2019/02/05', '2020/01/01', '2024/12/25']

// 视频源（test-videos.co.uk 免费测试视频）
const VIDEO_SOURCES = [
  { key: 'bbb360', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', w: 640, h: 360, label: 'Big Buck Bunny 360p' },
  { key: 'bbb720', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', w: 1280, h: 720, label: 'Big Buck Bunny 720p' },
  { key: 'jelly720', url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', w: 1280, h: 720, label: 'Jellyfish 720p' },
  { key: 'jelly360', url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4', w: 640, h: 360, label: 'Jellyfish 360p' },
  { key: 'sintel360', url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4', w: 640, h: 360, label: 'Sintel 360p' },
]

/* ---------------- 工具函数 ---------------- */

const pad = (n) => String(n).padStart(2, '0')
const dtStr = (y, m, d) => `${y}-${m}-${d} 12:00:00` // 统一存当天中午，展示更自然
const ensureDir = (dir) => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }) }

// 用 curl 下载（本机 undici fetch 的连接超时不可靠，curl 的 IPv4 回退更稳），带重试
async function download(url, dest, retries = 3, fallbackFrom = null) {
  if (existsSync(dest)) return dest
  const isVideoFile = dest.endsWith('.mp4')
  // 视频文件大，允许更长超时；图片 60s 足够
  const maxTime = isVideoFile ? 300 : 60
  // 最小有效体积：防止 curl 超时留下截断的半成品（mp4 至少几百 KB）
  const minSize = isVideoFile ? 300 * 1024 : 3000
  for (let i = 1; i <= retries; i++) {
    try {
      if (existsSync(dest)) rmSync(dest)
      execFileSync('curl', ['-sL', '--max-time', String(maxTime), '-o', dest, url], { stdio: 'pipe' })
      if (existsSync(dest) && statSync(dest).size >= minSize) return dest
      if (existsSync(dest)) rmSync(dest)
    } catch (e) {
      // curl 超时/失败：清掉可能的半成品后重试
      if (existsSync(dest)) rmSync(dest)
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 1500 * i))
  }
  // 视频下载失败：复用缓存里已有的完整视频（比生成假 mp4 更真实）
  if (isVideoFile && fallbackFrom && existsSync(fallbackFrom) && statSync(fallbackFrom).size >= minSize) {
    console.log(`  ⚠ 下载失败，复用已有视频: ${url.split('/').pop()} -> ${fallbackFrom.split(/[\\/]/).pop()}`)
    copyFileSync(fallbackFrom, dest)
    return dest
  }
  // 外部下载全部失败，用 sharp 生成本地占位图
  console.log(`  ⚠ 下载失败，生成占位图: ${url.split('/').pop()}`)
  const w = url.includes('800') ? 800 : url.includes('600') ? 600 : 400
  const h = url.includes('800') ? 600 : url.includes('600') ? 800 : 300
  const bg = `hsl(${Math.random() * 360 | 0}, 40%, 85%)`
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" font-size="24" text-anchor="middle" dy=".3em" fill="#666">Memoir</text></svg>`)
  await sharp(svg).jpeg({ quality: 85 }).toFile(dest)
  return dest
}

// 视频缩略图占位图（无 ffmpeg 环境，用 SVG 生成深色播放按钮图）
async function makeVideoThumb(dest) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="#23233a"/>
    <circle cx="320" cy="180" r="58" fill="rgba(255,255,255,0.16)"/>
    <polygon points="297,143 297,217 353,180" fill="#ffffff"/>
  </svg>`
  await sharp(Buffer.from(svg)).resize(400, null, { withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(dest)
}

/* ---------------- 主流程 ---------------- */

async function main() {
  if (!existsSync(DB_PATH)) {
    console.error(`找不到数据库 ${DB_PATH}，请先启动一次后端（npm run start:dev）创建表结构`)
    process.exit(1)
  }
  const db = new Database(DB_PATH)

  // 上传者：取第一个用户；没有则自动建一个测试账号
  let uploader = db.prepare('SELECT id, username FROM users LIMIT 1').get()
  if (!uploader) {
    const bcrypt = require('bcrypt')
    const id = randomUUID()
    db.prepare('INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
      .run(id, 'family', 'family@memoir.com', bcrypt.hashSync('123456', 10), 'MEMBER', dtStr(2026, 11, 3), dtStr(2026, 11, 3))
    uploader = { id, username: 'family' }
    console.log(`已创建测试账号 family / 123456`)
  }
  console.log(`上传者: ${uploader.username} (${uploader.id})`)

  // 清空旧测试数据
  db.prepare('DELETE FROM media').run()
  for (const dir of [UPLOAD_DIR, THUMB_DIR]) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      rmSync(join(dir, name), { recursive: true, force: true })
    }
  }
  ensureDir(UPLOAD_DIR)
  ensureDir(THUMB_DIR)
  ensureDir(CACHE_DIR)
  console.log('已清空旧 media 数据\n')

  // picsum 可用 ID（0-101，剔除缺失的 86/97）
  const photoIds = [...Array(102).keys()].filter((i) => i !== 86 && i !== 97).slice(0, 60)
  const ASPECTS = ['800/600', '600/800', '800/800'] // 横/竖/方，混合更自然

  // 组装全部条目
  const entries = []
  DATES.forEach(([y, m, d], i) => {
    entries.push({ y, m, d, kind: 'PHOTO', photoId: photoIds[i % photoIds.length], aspect: ASPECTS[i % 3] })
  })
  EXTRA_PHOTO_DATES.forEach((key, i) => {
    const [y, m, d] = key.split('/')
    entries.push({ y, m, d, kind: 'PHOTO', photoId: photoIds[54 + i], aspect: ASPECTS[(i + 1) % 3] })
  })
  VIDEO_DATES.forEach((key, i) => {
    const [y, m, d] = key.split('/')
    entries.push({ y, m, d, kind: 'VIDEO', video: VIDEO_SOURCES[i % VIDEO_SOURCES.length] })
  })

  const insert = db.prepare(`INSERT INTO media
    (id, filename, original_path, thumbnail_path, media_type, file_size, mime_type,
     duration, width, height, taken_at, year, month, day, exif_data, uploaded_by, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)

  let done = 0
  for (const e of entries) {
    const absDir = join(UPLOAD_DIR, e.y, e.m, e.d)
    const thumbDir = join(THUMB_DIR, e.y, e.m, e.d)
    ensureDir(absDir)
    ensureDir(thumbDir)

    let srcFile, ext, mime, width, height, duration = 0
    if (e.kind === 'PHOTO') {
      srcFile = await download(`https://picsum.photos/id/${e.photoId}/${e.aspect}`, join(CACHE_DIR, `picsum_${e.photoId}_${e.aspect.replace('/', 'x')}.jpg`))
      ext = '.jpg'
      mime = 'image/jpeg'
      const meta = await sharp(srcFile).metadata()
      width = meta.width || 0
      height = meta.height || 0
    } else {
      const v = e.video
      // 视频下载失败时，复用缓存里已有的完整视频（挑一个最大的）
      const cachedMp4s = existsSync(CACHE_DIR)
        ? readdirSync(CACHE_DIR).filter((f) => f.endsWith('.mp4')).map((f) => join(CACHE_DIR, f))
        : []
      const bestCached = cachedMp4s
        .filter((f) => statSync(f).size >= 300 * 1024)
        .sort((a, b) => statSync(b).size - statSync(a).size)[0]
      srcFile = await download(v.url, join(CACHE_DIR, `${v.key}.mp4`), 3, bestCached)
      ext = '.mp4'
      mime = 'video/mp4'
      width = v.w
      height = v.h
      duration = 10
    }

    const safeName = `${Date.now()}_${randomUUID().slice(0, 8)}${ext}`
    const absPath = join(absDir, safeName)
    copyFileSync(srcFile, absPath)

    const thumbName = safeName.replace(ext, '_thumb.jpg')
    const thumbPath = join(thumbDir, thumbName)
    if (e.kind === 'PHOTO') {
      await sharp(absPath).resize(400, null, { withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(thumbPath)
    } else {
      await makeVideoThumb(thumbPath)
    }

    const takenAt = dtStr(e.y, e.m, e.d)
    insert.run(
      randomUUID(), safeName,
      `/uploads/${e.y}/${e.m}/${e.d}/${safeName}`,
      `/thumbnails/${e.y}/${e.m}/${e.d}/${thumbName}`,
      e.kind, statSync(absPath).size, mime,
      duration, width, height,
      takenAt, Number(e.y), Number(e.m), Number(e.d),
      null, uploader.id, takenAt, takenAt,
    )
    done++
    console.log(`[${done}/${entries.length}] ${e.kind === 'PHOTO' ? '照片' : '视频'} ${e.y}-${e.m}-${e.d}  ${safeName} (${width}x${height})`)
  }

  db.close()

  // 汇总
  const db2 = new Database(DB_PATH)
  const byYear = db2.prepare('SELECT year, COUNT(*) c FROM media GROUP BY year ORDER BY year').all()
  const byType = db2.prepare('SELECT media_type, COUNT(*) c FROM media GROUP BY media_type').all()
  db2.close()
  console.log(`\n完成：共 ${done} 条`)
  console.log('按类型:', byType.map((r) => `${r.media_type}=${r.c}`).join(', '))
  console.log('按年份:', byYear.map((r) => `${r.year}:${r.c}`).join('  '))
  console.log(`\n登录账号: ${uploader.username} / 123456`)
}

main().catch((err) => {
  console.error('种子脚本执行失败:', err)
  process.exit(1)
})
