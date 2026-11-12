<template>
  <div ref="rootEl" class="home">
    <!-- ===== Hero ===== -->
    <header ref="heroEl" class="hero" @mousemove="onHeroMouse">
      <div class="hero-orb orb-a" aria-hidden="true" />
      <div class="hero-orb orb-b" aria-hidden="true" />
      <div class="hero-glow" aria-hidden="true" />

      <div class="hero-grid">
        <div ref="heroCopyEl" class="hero-copy">
          <p class="eyebrow animate__animated animate__fadeInDown">Family Memoir · 家庭回忆</p>
          <h1 ref="titleEl" class="hero-title">
            <span class="line">每一张照片，</span>
            <span class="line">都是回家的路</span>
          </h1>
          <p class="hero-sub animate__animated animate__fadeInUp animate__delay-1s">记录温暖瞬间，留住时光故事</p>
          <div ref="ruleEl" class="hero-rule" />

          <dl v-if="stats.total" class="hero-digits">
            <div class="digit">
              <dt>{{ startYear }}</dt>
              <dd>起始年份</dd>
            </div>
            <div class="digit">
              <dt ref="photosRef">0</dt>
              <dd>张照片</dd>
            </div>
            <div class="digit">
              <dt ref="storiesRef">0</dt>
              <dd>个故事</dd>
            </div>
          </dl>
        </div>

        <figure
          v-if="coverMedia"
          ref="heroPhotoEl"
          class="hero-photo"
          v-focusable
          @click="router.push(`/media/${coverMedia.id}`)"
        >
          <img :src="mediaStore.getMediaUrl(coverMedia.thumbnailPath)" :alt="coverMedia.filename" />
          <figcaption>{{ formatDate(coverMedia.takenAt) }}</figcaption>
        </figure>
      </div>
    </header>

    <!-- ===== 快捷入口（保持原样） ===== -->
    <nav class="quick-nav">
      <div
        v-for="(card, i) in quickCards"
        :key="card.title"
        class="quick-item animate__animated animate__fadeInUp"
        :style="{ animationDelay: `${0.5 + i * 0.12}s` }"
        v-focusable
        @click="handleQuickCard(card)"
      >
        <span class="quick-icon"><AppIcon :name="card.icon" :size="19" /></span>
        <span class="quick-text">
          <strong>{{ card.title }}</strong>
          <em>{{ card.desc }}</em>
        </span>
        <AppIcon name="chevronRight" :size="15" class="quick-arrow" />
      </div>
    </nav>

    <!-- ===== 时光之旅：GSAP 滚动叙事 ===== -->
    <section ref="journeyEl" class="journey">
      <div class="section-head">
        <h2>时光之旅</h2>
        <span class="eyebrow">Scroll to travel</span>
      </div>

      <div v-if="journeyStory" class="journey-body">
        <figure ref="journeyPhotoWrap" class="journey-photo">
          <img
            :src="mediaStore.getMediaUrl(journeyStory.media.thumbnailPath)"
            :alt="journeyStory.media.filename"
          />
          <figcaption>{{ formatDate(journeyStory.media.takenAt) }} · 最早的故事</figcaption>
        </figure>

        <div class="journey-text">
          <span ref="yearEl" class="journey-year">{{ journeyYear }}</span>
          <p ref="journeyKicker" class="journey-kicker">{{ journeyKickerText }}</p>
          <p ref="journeyContent" class="journey-content">{{ journeyStory.content }}</p>
          <router-link
            :to="`/media/${journeyStory.mediaId}`"
            class="journey-link"
          >
            打开这段回忆<AppIcon name="arrowRight" :size="13" />
          </router-link>
        </div>
      </div>

      <div v-else class="journey-empty">
        <EmptyMascot pose="book" color="peach"><AppIcon name="book" :size="18" /></EmptyMascot>
        <p>写下第一个故事，这里会按时间带你往回走</p>
        <router-link to="/stories" class="btn btn-primary">去写故事</router-link>
      </div>

      <div v-if="timelineYears.length" class="journey-timeline">
        <div ref="timelineLineRef" class="timeline-line" />
        <div class="timeline-nodes">
          <span
            v-for="y in timelineYears"
            :key="y.year"
            ref="timelineNodeRefs"
            class="timeline-node"
            :class="{ on: y.year === journeyYear }"
          >
            {{ y.year }}
          </span>
        </div>
      </div>
    </section>

    <!-- ===== 历史上的今天（保持原样） ===== -->
    <section v-if="otdLoading" class="on-this-day">
      <div class="section-head">
        <h2>历史上的今天</h2>
        <span class="eyebrow">On This Day</span>
      </div>
      <div class="otd-grid">
        <SkeletonCard v-for="n in 4" :key="n" variant="media" />
      </div>
    </section>

    <section v-else-if="onThisDay.length" class="on-this-day">
      <div class="section-head">
        <h2>历史上的今天</h2>
        <span class="eyebrow">On This Day</span>
      </div>
      <div class="otd-grid">
        <figure
          v-for="(m, i) in onThisDay"
          :key="m.id"
          v-reveal="i * 60"
          class="otd-item"
          @click="openOtd(i)"
        >
          <img :src="mediaStore.getMediaUrl(m.thumbnailPath)" :alt="m.filename" loading="lazy" />
          <figcaption>
            <span class="otd-ago">{{ yearsAgo(m.takenAt) }} 年前</span>
            <span class="otd-date">{{ formatDate(m.takenAt) }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- ===== 最近回忆（保持原样） ===== -->
    <section class="recent">
      <div class="section-head">
        <h2>最近回忆</h2>
        <router-link v-if="recentMedia.length" to="/gallery" class="more-link">
          查看全部<AppIcon name="arrowRight" :size="14" />
        </router-link>
      </div>

      <div v-if="recentLoading" class="recent-grid">
        <SkeletonCard v-for="n in 8" :key="n" variant="media" />
      </div>

      <div v-else-if="recentMedia.length" class="recent-grid">
        <figure
          v-for="(media, i) in recentMedia"
          :key="media.id"
          v-reveal="i * 45"
          class="recent-item"
          @click="openRecent(i)"
        >
          <img :src="mediaStore.getMediaUrl(media.thumbnailPath)" :alt="media.filename" loading="lazy" />
          <figcaption>
            <span class="recent-date">{{ formatDate(media.takenAt) }}</span>
            <span v-if="media.mediaType === 'VIDEO'" class="recent-badge"><AppIcon name="film" :size="12" />视频</span>
          </figcaption>
        </figure>
      </div>

      <div v-else-if="notLoggedIn" class="empty-state">
        <EmptyMascot pose="heart" color="peach"><AppIcon name="heart" :size="18" /></EmptyMascot>
        <p>登录后即可查看家庭回忆</p>
        <router-link to="/login" class="btn btn-primary">去登录</router-link>
      </div>

      <div v-else class="empty-state">
        <EmptyMascot pose="camera" color="mint"><AppIcon name="image" :size="18" /></EmptyMascot>
        <p>还没有回忆呢，快去上传第一张照片吧</p>
        <router-link to="/gallery" class="btn btn-primary">浏览画廊</router-link>
      </div>
    </section>

    <!-- ===== 故事墙：三列视差 ===== -->
    <section v-if="wallColumns.length" ref="wallEl" class="story-wall">
      <div class="section-head">
        <h2>故事墙</h2>
        <span class="eyebrow">Stories · {{ stories.length }}</span>
        <router-link to="/stories" class="more-link">
          查看全部<AppIcon name="arrowRight" :size="14" />
        </router-link>
      </div>

      <div class="wall-cols">
        <div
          v-for="(col, ci) in wallColumns"
          :key="ci"
          :ref="(el) => setWallColRef(el, ci)"
          class="wall-col"
          :class="`col-${ci}`"
        >
          <article
            v-for="story in col"
            :key="story.id"
            class="wall-card"
            v-focusable
            @click="router.push(`/media/${story.mediaId}`)"
          >
            <img
              :src="mediaStore.getMediaUrl(story.media?.thumbnailPath)"
              :alt="story.media?.filename"
              loading="lazy"
            />
            <div class="wall-ops">
              <FavoriteButton
                :model-value="!!favMap[story.mediaId]"
                :media-id="story.mediaId"
                variant="card"
                @update:model-value="(v) => (favMap[story.mediaId] = v)"
              />
              <button class="wall-op" title="编辑故事" @click.stop="openEdit(story)">
                <AppIcon name="edit" :size="14" />
              </button>
              <button class="wall-op danger" title="删除故事" @click.stop="confirmDelete(story)">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
            <div class="wall-memo">
              <span class="wall-date">{{ formatDate(story.media?.takenAt) }}</span>
              <p class="wall-text">{{ story.content }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 故事编辑弹窗（复用现有组件） -->
    <StoryEditModal
      v-model="editOpen"
      :story="editingStory"
      @save="handleSave"
      @remove-extra="removeExtra"
    />

    <!-- 删除确认（复用现有组件） -->
    <ConfirmDialog
      v-model="deleteOpen"
      title="删除故事"
      message="确定要删除这个故事吗？删除后故事内容将无法恢复。"
      @confirm="executeDelete"
    />

    <!-- 灯箱：OTD 与最近回忆共用（保持原样） -->
    <Lightbox
      v-model="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="lightboxItems"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useMediaStore } from '@/stores/media'
import { useAuthStore } from '@/stores/auth'
import { mediaApi, notesApi } from '@/api'
import { countUp } from '@/directives/reveal'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AppIcon from '@/components/AppIcon.vue'
import Lightbox from '@/components/Lightbox.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import EmptyMascot from '@/components/EmptyMascot.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import StoryEditModal from '@/components/StoryEditModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

gsap.registerPlugin(ScrollTrigger)

const router = useRouter()
const toast = useToast()
const mediaStore = useMediaStore()
const authStore = useAuthStore()

const rootEl = ref(null)
const heroEl = ref(null)
const heroCopyEl = ref(null)
const heroPhotoEl = ref(null)
const titleEl = ref(null)
const ruleEl = ref(null)
const photosRef = ref(null)
const storiesRef = ref(null)
const journeyEl = ref(null)
const journeyPhotoWrap = ref(null)
const yearEl = ref(null)
const journeyKicker = ref(null)
const journeyContent = ref(null)
const timelineLineRef = ref(null)
const timelineNodeRefs = ref([])
const wallEl = ref(null)
const wallColRefs = ref([])

const recentMedia = ref([])
const recentLoading = ref(false)
const onThisDay = ref([])
const otdLoading = ref(false)
const notLoggedIn = ref(!authStore.isLoggedIn)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxSource = ref('recent') // 'otd' | 'recent'

const stats = ref({ total: 0, photos: 0, noteCount: 0, years: [], span: { from: null, to: null } })
const stories = ref([])
const favMap = ref({})

const editOpen = ref(false)
const editingStory = ref(null)
const deleteOpen = ref(false)
const storyToDelete = ref(null)

// 灯箱列表随来源切换：OTD 模块打开时只浏览 OTD 的回忆
const lightboxItems = computed(() =>
  lightboxSource.value === 'otd' ? onThisDay.value : recentMedia.value
)

const quickCards = [
  { icon: 'image', title: '回忆画廊', desc: '浏览所有照片与视频', to: '/gallery' },
  { icon: 'clock', title: '时光之旅', desc: '按年月日回溯往事', to: '/timeline' },
  { icon: 'book', title: '回忆故事', desc: '带文字备注的珍藏', to: '/stories' },
  { icon: 'shuffle', title: '随机回忆', desc: '来一段意外的惊喜', action: 'random' },
]

// 首屏实体照片：优先最近一张，其次最早的故事封面
const coverMedia = computed(() => recentMedia.value[0] || stories.value[0]?.media || null)

const startYear = computed(() => stats.value.span?.from || '—')

// 时光之旅：取最早的一条故事，没故事就走空态引导
const journeyStory = computed(() => {
  const list = stories.value.filter((s) => s.media?.takenAt)
  if (!list.length) return null
  return [...list].sort(
    (a, b) => new Date(a.media.takenAt) - new Date(b.media.takenAt)
  )[0]
})

const journeyYear = computed(() =>
  journeyStory.value ? new Date(journeyStory.value.media.takenAt).getFullYear() : null
)

const journeyKickerText = computed(() => {
  if (!journeyStory.value) return ''
  const d = new Date(journeyStory.value.media.takenAt)
  return `${CN_YEAR(d)} · ${d.getMonth() + 1} 月`
})

// 时间轴：年份太多时抽样成 5 个节点，并保证包含时光之旅的年份
const timelineYears = computed(() => {
  const list = (stats.value.years || []).slice().sort((a, b) => a.year - b.year)
  if (!list.length) return []
  if (list.length <= 5) return list

  const picked = []
  for (let i = 0; i < 5; i += 1) {
    picked.push(list[Math.round((i * (list.length - 1)) / 4)])
  }

  const jy = journeyYear.value
  if (jy && !picked.some((p) => p.year === jy)) {
    const hit = list.find((l) => l.year === jy)
    if (hit) picked[2] = hit
    picked.sort((a, b) => a.year - b.year)
  }
  return picked
})

// 故事墙：最多 6 条，按 3 列轮流分配
const wallStories = computed(() => stories.value.filter((s) => s.media).slice(0, 6))
const wallColumns = computed(() => {
  if (!wallStories.value.length) return []
  const cols = [[], [], []]
  wallStories.value.forEach((s, i) => cols[i % 3].push(s))
  return cols.filter((c) => c.length)
})

function setWallColRef(el, i) {
  if (el) wallColRefs.value[i] = el
}

function CN_YEAR(d) {
  return `${d.getFullYear()} 年`
}

// Hero 鼠标视差：光斑跟随指针
function onHeroMouse(e) {
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width - 0.5) * 2
  const y = ((e.clientY - r.top) / r.height - 0.5) * 2
  el.style.setProperty('--hmx', x.toFixed(3))
  el.style.setProperty('--hmy', y.toFixed(3))
}

async function loadAll() {
  if (!authStore.isLoggedIn) return

  otdLoading.value = true
  recentLoading.value = true
  try {
    const [statsRes, otdRes, mediaRes, storiesRes] = await Promise.allSettled([
      mediaApi.getStats(),
      mediaApi.getOnThisDay(),
      mediaStore.fetchMedia({ page: 1, limit: 20 }),
      notesApi.findMy(),
    ])
    if (statsRes.status === 'fulfilled' && statsRes.value) stats.value = statsRes.value
    if (otdRes.status === 'fulfilled') onThisDay.value = otdRes.value || []
    if (mediaRes.status === 'fulfilled') recentMedia.value = mediaStore.items
    if (storiesRes.status === 'fulfilled') {
      stories.value = (storiesRes.value || []).map((s) => ({ ...s }))
      stories.value.forEach((s) => {
        if (s.mediaId) favMap.value[s.mediaId] = !!s.media?.isFavorite
      })
    }
  } finally {
    otdLoading.value = false
    recentLoading.value = false
  }
}

function yearsAgo(dateStr) {
  if (!dateStr) return ''
  return new Date().getFullYear() - new Date(dateStr).getFullYear()
}

function openOtd(i) {
  lightboxSource.value = 'otd'
  lightboxIndex.value = i
  lightboxOpen.value = true
}

function openRecent(i) {
  lightboxSource.value = 'recent'
  lightboxIndex.value = i
  lightboxOpen.value = true
}

function handleQuickCard(card) {
  if (card.action === 'random') {
    openRandomMemory()
  } else if (card.to) {
    router.push(card.to)
  }
}

async function openRandomMemory() {
  try {
    // 利用已加载的最近回忆，若不足则补拉一页
    const pool = recentMedia.value.length
      ? recentMedia.value
      : await mediaStore.fetchMedia({ page: 1, limit: 50 }).then(() => mediaStore.items)
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      router.push(`/media/${pick.id}`)
    } else {
      router.push('/gallery')
    }
  } catch {
    router.push('/gallery')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/* ===== 故事墙的增删改：全部复用现有接口与组件 ===== */
async function openEdit(story) {
  // 先补齐附加照片，避免保存时把 extraMediaIds 冲空
  const extraIds = story.extraMediaIds || []
  let extraMedias = []
  if (extraIds.length) {
    const res = await Promise.all(extraIds.map((id) => mediaApi.getOne(id).catch(() => null)))
    extraMedias = res.filter(Boolean)
  }
  editingStory.value = { ...story, extraMedias }
  editOpen.value = true
}

async function handleSave(form) {
  if (!editingStory.value) return
  try {
    await notesApi.upsert({
      mediaId: editingStory.value.mediaId,
      content: form.content,
      mood: form.mood || undefined,
      tags: form.tags,
      extraMediaIds: (editingStory.value.extraMedias || []).map((m) => m.id),
    })
    toast.success('故事已保存')
    editOpen.value = false
    stories.value = await notesApi.findMy()
  } catch {
    toast.error('保存失败，请重试')
  }
}

function removeExtra(index) {
  editingStory.value?.extraMedias?.splice(index, 1)
}

function confirmDelete(story) {
  storyToDelete.value = story
  deleteOpen.value = true
}

async function executeDelete() {
  if (!storyToDelete.value) return
  try {
    await notesApi.remove(storyToDelete.value.id)
    toast.success('故事已删除')
    stories.value = stories.value.filter((s) => s.id !== storyToDelete.value.id)
  } catch {
    toast.error('删除失败')
  } finally {
    deleteOpen.value = false
    storyToDelete.value = null
  }
}

/* ===== GSAP 动效 ===== */
let ctx = null

function isReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initMotion() {
  if (isReduced()) return // 尊重系统设置，直接停在终态

  ctx = gsap.context(() => {
    // 1) 首屏文字：两行由模糊聚焦入场
    if (titleEl.value) {
      gsap.from(titleEl.value.querySelectorAll('.line'), {
        opacity: 0,
        filter: 'blur(12px)',
        y: 26,
        duration: 0.95,
        stagger: 0.14,
        ease: 'power2.out',
      })
    }
    if (ruleEl.value) {
      gsap.from(ruleEl.value, {
        scaleX: 0,
        opacity: 0,
        transformOrigin: 'left center',
        duration: 0.8,
        delay: 0.35,
        ease: 'power2.out',
      })
    }

    // 2) 首屏实体照片：从下方浮起并旋正
    if (heroPhotoEl.value) {
      gsap.fromTo(
        heroPhotoEl.value,
        { y: 26, opacity: 0, rotate: 0, scale: 0.96 },
        { y: 0, opacity: 1, rotate: -2.6, scale: 1, duration: 1.1, delay: 0.15, ease: 'power3.out' },
      )
      // 动画结束后交还 CSS，保证 hover 的 rotate/位移还能生效
      gsap.delayedCall(1.3, () => {
        if (heroPhotoEl.value) gsap.set(heroPhotoEl.value, { clearProps: 'transform,opacity' })
      })
    }

    // 3) 数字递增：沿用现有 countUp，不另造一套
    if (photosRef.value) countUp(photosRef.value, stats.value.photos || 0, 900)
    if (storiesRef.value) countUp(storiesRef.value, stats.value.noteCount || 0, 1050)

    // 4) 首屏随滚动轻微上移淡出
    if (heroEl.value) {
      gsap.to(heroCopyEl.value, {
        y: -36,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: { trigger: heroEl.value, start: 'top top', end: 'bottom top', scrub: true },
      })
    }

    // 5) 时光之旅：照片揭幕、年份聚焦、正文错峰、时间轴生长
    if (journeyEl.value && journeyStory.value) {
      gsap.set(journeyPhotoWrap.value, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.06 })
      gsap.set(yearEl.value, { opacity: 0, filter: 'blur(14px)' })

      ScrollTrigger.create({
        trigger: journeyEl.value,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.to(journeyPhotoWrap.value, {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            duration: 1.05,
            ease: 'power3.out',
          })
          gsap.to(yearEl.value, {
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'power2.out',
          })
          gsap.from([journeyKicker.value, journeyContent.value], {
            y: 18,
            opacity: 0,
            duration: 0.75,
            stagger: 0.18,
            delay: 0.15,
            ease: 'power2.out',
          })
          if (timelineLineRef.value) {
            gsap.from(timelineLineRef.value, {
              scaleX: 0,
              transformOrigin: 'left center',
              duration: 1.1,
              delay: 0.2,
              ease: 'power2.inOut',
            })
          }
          if (timelineNodeRefs.value.length) {
            gsap.from(timelineNodeRefs.value, {
              opacity: 0,
              y: 8,
              duration: 0.5,
              stagger: 0.1,
              delay: 0.35,
            })
          }
        },
      })
    }

    // 6) 故事墙：三列视差 + 卡片错峰入场
    if (wallEl.value) {
      wallColRefs.value.forEach((col, i) => {
        if (!col) return
        const dist = [-44, -12, 26][i] ?? 0
        gsap.to(col, {
          y: dist,
          ease: 'none',
          scrollTrigger: { trigger: wallEl.value, start: 'top bottom', end: 'bottom top', scrub: 1 },
        })
      })

      const cards = wallEl.value.querySelectorAll('.wall-card')
      if (cards.length) {
        gsap.from(cards, {
          y: 22,
          opacity: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power2.out',
          scrollTrigger: { trigger: wallEl.value, start: 'top 82%', once: true },
        })
      }
    }
  }, rootEl.value)
}

onMounted(async () => {
  await loadAll()
  await nextTick()
  initMotion()
})

onUnmounted(() => {
  if (ctx) ctx.revert()
})
</script>

<style scoped lang="scss">
.home {
  max-width: 1080px;
  margin: 0 auto;
}

/* ===== Hero ===== */
.hero {
  position: relative;
  z-index: 1;
  min-height: 500px;
  display: flex;
  align-items: center;
  padding: $space-7 0;
  background: $gradient-hero;
  border-radius: $radius-lg;
  margin-bottom: $space-5;
  overflow: hidden;
  --hmx: 0;
  --hmy: 0;
}

.hero-grid {
  position: relative;
  z-index: 1;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: $space-6;
  align-items: center;
  padding: 0 $space-6;
}

.hero-copy {
  min-width: 0;
}

/* 漂浮暖光斑 */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

.orb-a {
  width: 220px;
  height: 220px;
  top: -70px;
  right: 8%;
  background: var(--primary-soft, #e8c9b8);
  animation: orb-drift 14s ease-in-out infinite;
  translate: calc(var(--hmx) * 24px) calc(var(--hmy) * 24px);
}

.orb-b {
  width: 160px;
  height: 160px;
  bottom: -60px;
  left: 6%;
  background: #f0d9c8;
  animation: orb-drift 18s ease-in-out infinite reverse;
  translate: calc(var(--hmx) * -36px) calc(var(--hmy) * -36px);
}

/* 鼠标跟随的暖色涟漪光晕 */
.hero-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 180, 0.55), transparent 65%);
  filter: blur(20px);
  pointer-events: none;
  mix-blend-mode: soft-light;
  translate: calc(var(--hmx) * 300px - 180px) calc(var(--hmy) * 200px - 180px);
  z-index: 0;
}

@keyframes orb-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(14px, -18px) scale(1.08); }
  66% { transform: translate(-10px, 12px) scale(0.96); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orb {
    animation: none !important;
  }
}

.hero-title {
  font-family: $font-serif;
  font-size: $text-4xl;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.01em;
  margin: $space-3 0 $space-4;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-text) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  .line {
    display: block;
  }
}

.hero-sub {
  font-size: $text-lg;
  color: var(--text-secondary);
}

.hero-rule {
  width: 56px;
  height: 2px;
  background: var(--primary);
  margin-top: $space-5;
}

/* 首屏数字 */
.hero-digits {
  display: flex;
  gap: $space-7;
  margin: $space-6 0 0;
}

.digit {
  dt {
    font-family: $font-serif;
    font-size: $text-2xl;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  dd {
    margin: 2px 0 0;
    font-size: $text-xs;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }
}

/* 首屏实体照片 */
.hero-photo {
  position: relative;
  justify-self: end;
  width: 320px;
  background: var(--bg-card);
  padding: 12px 12px 46px;
  border-radius: 4px;
  box-shadow: 0 26px 60px rgba(45, 42, 38, 0.18), 0 6px 14px rgba(45, 42, 38, 0.08);
  transform: rotate(-2.6deg);
  cursor: pointer;
  transition: transform 0.4s $ease-out, box-shadow 0.4s $ease-out;

  img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    display: block;
    filter: saturate(0.92) contrast(0.96);
  }

  figcaption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 13px;
    text-align: center;
    font-family: $font-serif;
    font-size: $text-xs;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  &:hover {
    transform: rotate(-1.2deg) translateY(-3px);
    box-shadow: 0 30px 66px rgba(45, 42, 38, 0.24), 0 8px 16px rgba(45, 42, 38, 0.1);
  }
}

/* ===== 快捷入口（原样） ===== */
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-3;
  padding: $space-5 0 $space-7;
  border-top: 1px solid var(--border);
}

.quick-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border: 1px solid var(--border);
  border-radius: $radius-md;
  background: var(--bg-card);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateY(-4px);

    .quick-icon {
      background: var(--primary);
      color: #fff;
      transform: scale(1.05);
    }

    .quick-arrow {
      opacity: 1;
      transform: translateX(3px);
    }
  }
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: $primary-soft;
  color: var(--primary);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, color 0.3s ease;
}

.quick-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.4;

  strong {
    font-size: $text-base;
    font-weight: 600;
  }

  em {
    font-style: normal;
    font-size: $text-xs;
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.quick-arrow {
  color: var(--text-muted);
  opacity: 0;
  transition: $transition;
}

.quick-item.animate__animated {
  animation-fill-mode: backwards;
}

/* ===== 公共小节标题 ===== */
.section-head {
  display: flex;
  align-items: baseline;
  gap: $space-3;
  margin-bottom: $space-4;

  h2 {
    font-family: $font-serif;
    font-size: $text-xl;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .eyebrow {
    font-size: $text-xs;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
}

.more-link {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $text-xs;
  color: var(--primary-text);
  text-decoration: none;

  &:hover {
    color: var(--primary-dark);
  }
}

/* ===== 时光之旅 ===== */
.journey {
  padding: $space-7 0;
  border-top: 1px solid var(--border);
}

.journey-body {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: $space-7;
  align-items: start;
}

.journey-photo {
  background: var(--bg-card);
  padding: 12px;
  border-radius: 3px;
  box-shadow: 0 20px 48px rgba(45, 42, 38, 0.14);
  overflow: hidden;

  img {
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    display: block;
    filter: saturate(0.9);
  }

  figcaption {
    font-size: $text-xs;
    color: var(--text-muted);
    letter-spacing: 0.06em;
    margin-top: $space-2;
  }
}

.journey-text {
  position: relative;
  padding-top: $space-4;
  min-width: 0;
}

.journey-year {
  position: absolute;
  right: 0;
  top: -12px;
  font-family: $font-serif;
  font-size: 76px;
  font-weight: 600;
  line-height: 1;
  color: rgba(var(--primary-rgb), 0.16);
  pointer-events: none;
}

.journey-kicker {
  position: relative;
  z-index: 1;
  font-size: $text-xs;
  letter-spacing: 0.16em;
  color: var(--primary-text);
  margin-bottom: $space-3;
}

.journey-content {
  position: relative;
  z-index: 1;
  font-family: $font-serif;
  font-size: $text-base;
  line-height: 2;
  color: var(--text-secondary);
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.journey-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: $space-3;
  font-size: $text-xs;
  color: var(--primary-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.journey-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-6;
  border: 1px dashed var(--border-strong);
  border-radius: $radius-lg;
  color: var(--text-secondary);

  p {
    margin: 0;
    font-size: $text-sm;
  }
}

.journey-timeline {
  margin-top: $space-7;
  padding: 0 2px;
}

.timeline-line {
  height: 1px;
  background: var(--border-strong);
}

.timeline-nodes {
  display: flex;
  justify-content: space-between;
  margin-top: -1px;
}

.timeline-node {
  position: relative;
  padding-top: $space-4;
  font-size: $text-xs;
  letter-spacing: 0.08em;
  color: var(--text-muted);

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--border-strong);
  }

  &.on {
    color: var(--primary-text);
    font-weight: 600;

    &::before {
      background: var(--primary);
      box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.16);
    }
  }
}

/* ===== 历史上的今天（原样） ===== */
.on-this-day {
  margin-bottom: $space-7;
}

.otd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: $space-4;
}

.otd-item {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  background: var(--bg-light);
  border: 1px solid var(--border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s $ease-out;
  }

  &:hover img {
    transform: scale(1.04);
  }

  figcaption {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: $space-4 $space-3 $space-3;
    background: linear-gradient(transparent 40%, rgba(20, 18, 16, 0.66));
    color: #fff;
  }
}

.otd-ago {
  font-family: $font-serif;
  font-size: $text-xl;
  font-weight: 600;
  line-height: 1.2;
}

.otd-date {
  font-size: $text-xs;
  opacity: 0.85;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* ===== 最近回忆（原样） ===== */
.recent {
  margin-bottom: $space-7;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $space-4;
}

.recent-item {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  background: var(--bg-light);
  border: 1px solid var(--border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s $ease-out;
  }

  &:hover img {
    transform: scale(1.04);
  }

  figcaption {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-5 $space-3 $space-2;
    background: linear-gradient(transparent, rgba(20, 18, 16, 0.62));
    color: #fff;
    opacity: 0;
    transform: translateY(6px);
    transition: $transition;
  }

  &:hover figcaption {
    opacity: 1;
    transform: translateY(0);
  }
}

.recent-date {
  font-size: $text-xs;
  letter-spacing: 0.04em;
}

.recent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $text-xs;
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 8px;
  border-radius: $radius-full;
}

/* ===== 故事墙 ===== */
.story-wall {
  padding: $space-7 0 $space-8;
  border-top: 1px solid var(--border);
}

.wall-cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-5;
  align-items: start;
}

.wall-col {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  will-change: transform;

  &.col-1 {
    margin-top: $space-5;
  }

  &.col-2 {
    margin-top: $space-7;
  }
}

.wall-card {
  position: relative;
  background: var(--bg-card);
  padding: 8px;
  border-radius: 3px;
  box-shadow: 0 14px 34px rgba(45, 42, 38, 0.12);
  cursor: pointer;
  transition: transform 0.35s $ease-out, box-shadow 0.35s $ease-out;

  img {
    width: 100%;
    object-fit: cover;
    display: block;
    filter: saturate(0.9) contrast(0.97);
  }

  &:nth-child(odd) img {
    aspect-ratio: 4 / 3;
  }

  &:nth-child(even) img {
    aspect-ratio: 3 / 2;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 44px rgba(45, 42, 38, 0.18);

    .wall-ops {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.wall-ops {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.24s $ease-out, transform 0.24s $ease-out;
}

.wall-op {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: $radius-full;
  background: rgba(28, 25, 22, 0.45);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: $transition-fast;

  &:hover {
    background: rgba(28, 25, 22, 0.62);
  }

  &.danger:hover {
    background: var(--error);
  }
}

.wall-memo {
  padding: $space-3 $space-1 $space-1;

  .wall-date {
    display: block;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    margin-bottom: 5px;
  }

  .wall-text {
    font-family: $font-serif;
    font-size: $text-sm;
    line-height: 1.85;
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .hero {
    min-height: auto;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: $space-5;
  }

  .hero-photo {
    justify-self: start;
    width: 220px;
    order: -1;
  }

  .hero-title {
    font-size: $text-3xl;
  }

  .hero-digits {
    gap: $space-6;
  }

  .journey-body {
    grid-template-columns: 1fr;
    gap: $space-5;
  }

  .journey-year {
    font-size: 56px;
  }

  .wall-cols {
    grid-template-columns: 1fr;
  }

  .wall-col {
    margin-top: 0 !important;
  }

  .wall-ops {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: $space-5 0 $space-4;
    border-radius: $radius-md;
  }

  .hero-grid {
    padding: 0 $space-4;
  }

  .hero-title {
    font-size: $text-2xl;
  }

  .journey {
    padding: $space-6 0;
  }

  .timeline-nodes {
    flex-wrap: wrap;
    gap: $space-3;
  }
}
</style>
