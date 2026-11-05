<template>
  <div v-if="visible" ref="el" class="pet"
       :class="[`c-${color}`, state, { dragging }]"
       :style="{ left: pos.x + 'px', top: pos.y + 'px', right: 'auto', bottom: 'auto' }"
       aria-hidden="true"
       @mousedown="onPetDown"
       @mouseenter="onEnterPet"
       @mouseleave="onLeavePet">
    <i class="ear l"><em /></i><i class="ear r"><em /></i>
    <i class="belly" />
    <i class="arm l" /><i class="arm r" />
    <i class="eye l"><b class="pupil" /><b class="shine" /></i>
    <i class="eye r"><b class="pupil" /><b class="shine" /></i>
    <i class="cheek l" /><i class="cheek r" />
    <i class="mouth" />
    <i class="foot l" /><i class="foot r" />
    <i v-if="state === 'sleep'" class="zzz">z z z</i>
    <i v-if="hearts" class="heart-pop">♥</i>
    <i v-if="state === 'dizzy'" class="stars">✦ ✦ ✦</i>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  color: { type: String, default: 'cream' }
})

const route = useRoute()
const authStore = useAuthStore()
const el = ref(null)
const state = ref('idle') // idle | happy | shy | sleep | dizzy
const hearts = ref(false)
const dragging = ref(false)
const pos = ref({ x: 0, y: 0 })

const visible = computed(() => authStore.isLoggedIn && route.name !== 'login' && route.name !== 'register')

let idleTimer = null
let wiggleTimer = null
let clickTimes = []
let dragMoved = false
let offX = 0, offY = 0

function setIdleTimer() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => { state.value = 'sleep' }, 12000)
}

function wake() {
  if (state.value === 'dizzy') return
  if (state.value === 'sleep') state.value = 'idle'
  setIdleTimer()
}

function onMove(e) {
  if (dragging.value) return
  wake()
  const pet = el.value
  if (!pet) return
  const r = pet.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.hypot(dx, dy) || 1
  const max = 2
  const px = (dx / dist) * Math.min(max, dist / 50)
  const py = (dy / dist) * Math.min(max, dist / 50)
  pet.style.setProperty('--px', px.toFixed(2) + 'px')
  pet.style.setProperty('--py', py.toFixed(2) + 'px')
}

function onWindowClick(e) {
  if (el.value && el.value.contains(e.target)) return
  if (state.value === 'dizzy') return
  wake()
  hearts.value = false
  requestAnimationFrame(() => { hearts.value = true })
  setTimeout(() => (hearts.value = false), 900)
}

function onEnterPet() {
  if (state.value === 'sleep' || state.value === 'dizzy') return
  state.value = 'shy'
}
function onLeavePet() {
  if (state.value === 'shy') state.value = 'idle'
}

function onPetDown(e) {
  e.preventDefault()
  wake()
  const pet = el.value
  const r = pet.getBoundingClientRect()
  offX = e.clientX - r.left
  offY = e.clientY - r.top
  dragging.value = true
  dragMoved = false
  const startX = e.clientX
  const startY = e.clientY

  const onMouseMove = (ev) => {
    if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) dragMoved = true
    if (!dragMoved) return
    const nx = Math.max(0, Math.min(window.innerWidth - 70, ev.clientX - offX))
    const ny = Math.max(0, Math.min(window.innerHeight - 70, ev.clientY - offY))
    pos.value = { x: nx, y: ny }
  }
  const onMouseUp = () => {
    dragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    if (!dragMoved) onPetClick()
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onPetClick() {
  if (state.value === 'dizzy') return
  const now = Date.now()
  clickTimes = clickTimes.filter((t) => now - t < 1500)
  clickTimes.push(now)
  if (clickTimes.length >= 4) {
    state.value = 'dizzy'
    clickTimes = []
    setTimeout(() => { if (state.value === 'dizzy') state.value = 'idle' }, 1800)
    return
  }
  if (clickTimes.length >= 2) return
  state.value = 'happy'
  setTimeout(() => { if (state.value === 'happy') state.value = 'idle' }, 600)
}

// 随机小动作：歪头/抖耳朵
function scheduleWiggle() {
  wiggleTimer = setInterval(() => {
    if (state.value !== 'idle') return
    const pet = el.value
    if (!pet) return
    pet.classList.add('wiggle')
    setTimeout(() => pet.classList.remove('wiggle'), 700)
  }, 5000 + Math.random() * 3000)
}

onMounted(() => {
  pos.value = { x: window.innerWidth - 76, y: window.innerHeight - 120 }
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('click', onWindowClick)
  scheduleWiggle()
  setIdleTimer()
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('click', onWindowClick)
  clearInterval(wiggleTimer)
  clearTimeout(idleTimer)
})
</script>

<style scoped>
.pet {
  position: fixed;
  width: 58px;
  height: 56px;
  border-radius: 50%;
  background: #f3d9a4;
  box-shadow: 0 10px 22px rgba(90, 50, 20, 0.28), inset 0 -5px 10px rgba(0,0,0,0.07);
  z-index: 900;
  cursor: grab;
  user-select: none;
  touch-action: none;
  animation: breathe 3s ease-in-out infinite;
  transform-origin: center bottom;
}
.pet:active { cursor: grabbing; }

.c-cream { background: #f3d9a4; }
.c-peach { background: #f6c2a8; }
.c-mint { background: #c2e0cd; }
.c-cocoa { background: #dcb598; }

/* 耳朵 + 粉色内耳 */
.ear {
  position: absolute;
  top: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: inherit;
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.08);
}
.ear em {
  position: absolute;
  inset: 4px 4px 5px 4px;
  border-radius: 50%;
  background: rgba(232, 120, 100, 0.4);
}
.ear.l { left: 10px; transform: rotate(-10deg); }
.ear.r { right: 10px; transform: rotate(10deg); }

/* 肚皮 */
.belly {
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 34px;
  height: 22px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

/* 小短手 */
.arm {
  position: absolute;
  top: 30px;
  width: 9px;
  height: 12px;
  border-radius: 50%;
  background: inherit;
  box-shadow: inset 0 -2px 3px rgba(0,0,0,0.08);
  transition: transform 0.25s ease;
}
.arm.l { left: -3px; transform: rotate(15deg); }
.arm.r { right: -3px; transform: rotate(-15deg); }

/* 大眼睛（黑瞳 + 高光） */
.eye {
  position: absolute;
  top: 16px;
  width: 13px;
  height: 13px;
}
.eye.l { left: 15px; }
.eye.r { right: 15px; }
.pupil {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #2d1a12;
  transform: translate(var(--px, 0), var(--py, 0));
}
.shine {
  position: absolute;
  top: 2px;
  left: 3px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  transform: translate(var(--px, 0), var(--py, 0));
}

/* 腮红 */
.cheek {
  position: absolute;
  top: 32px;
  width: 8px;
  height: 5px;
  border-radius: 50%;
  background: rgba(232, 120, 100, 0.4);
  transition: background 0.25s ease;
}
.cheek.l { left: 8px; }
.cheek.r { right: 8px; }

/* 嘴 */
.mouth {
  position: absolute;
  bottom: 13px;
  left: 50%;
  width: 10px;
  height: 5px;
  border: 1.5px solid #6b4a2a;
  border-top: none;
  border-radius: 0 0 10px 10px;
  transform: translateX(-50%);
  transition: all 0.2s ease;
}

/* 小短脚 */
.foot {
  position: absolute;
  bottom: -3px;
  width: 13px;
  height: 6px;
  border-radius: 50%;
  background: rgba(90, 50, 20, 0.22);
  transition: transform 0.2s ease;
}
.foot.l { left: 12px; }
.foot.r { right: 12px; }

/* ===== 表情 ===== */
/* 开心：眼睛弯月牙、张嘴笑、挤压弹跳 */
.pet.happy { animation: happy-jump 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pet.happy .pupil { display: none; }
.pet.happy .shine { display: none; }
.pet.happy .eye {
  background: #2d1a12;
  border-radius: 0 0 13px 13px;
  height: 7px;
  top: 20px;
}
.pet.happy .arm.r { transform: rotate(-70deg) translateY(-4px); }
.pet.happy .mouth {
  width: 12px;
  height: 8px;
  border-radius: 0 0 12px 12px;
  background: #8a3a2a;
}

/* 害羞：腮红加深、眼睛看旁边、小手捂脸 */
.pet.shy .cheek { background: rgba(232, 100, 80, 0.75); }
.pet.shy .pupil { transform: translate(-2px, 0); }
.pet.shy .shine { transform: translate(-2px, 0); }
.pet.shy .arm.l { transform: rotate(-40deg) translate(-2px, -6px); }

/* 睡觉：眼睛变线、Zzz、呼吸起伏 */
.pet.sleep { animation: sleep-breath 3.4s ease-in-out infinite; }
.pet.sleep .pupil { display: none; }
.pet.sleep .shine { display: none; }
.pet.sleep .eye {
  top: 20px;
  height: 2px;
  background: #6b4a2a;
  border-radius: 2px;
}
.pet.sleep .mouth {
  width: 6px;
  height: 5px;
  border-radius: 50%;
  bottom: 12px;
}

/* 眩晕：眼睛变螺旋、晃头 */
.pet.dizzy { animation: dizzy-shake 0.5s ease-in-out infinite; }
.pet.dizzy .pupil { display: none; }
.pet.dizzy .shine { display: none; }
.pet.dizzy .eye::before {
  content: '@';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 900;
  color: #2d1a12;
}
.pet.dizzy .mouth {
  width: 9px;
  height: 3px;
  border-radius: 50%;
}

/* 拖拽：四肢悬空乱蹬 */
.pet.dragging { animation: drag-kick 0.3s ease-in-out infinite; }
.pet.dragging .foot { animation: feet-kick 0.3s ease-in-out infinite alternate; }

/* 随机歪头 */
.pet.wiggle { animation: wiggle 0.7s ease; }

/* 气泡 */
.zzz {
  position: absolute;
  top: -10px;
  right: -8px;
  font-size: 11px;
  color: #8a6a4a;
  font-weight: 700;
  letter-spacing: 1px;
  animation: zzz-float 2.4s ease-in-out infinite;
}
.heart-pop {
  position: absolute;
  top: -16px;
  left: 50%;
  color: #e87864;
  font-size: 15px;
  animation: heart-rise 0.9s ease-out forwards;
}
.stars {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #e8a83a;
  letter-spacing: 3px;
  animation: stars-spin 0.8s linear infinite;
}

/* ===== keyframes ===== */
@keyframes breathe {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.02, 0.98); }
}
@keyframes happy-jump {
  0% { transform: translateY(0) scale(1, 1); }
  25% { transform: translateY(4px) scale(1.1, 0.8); }
  55% { transform: translateY(-16px) scale(0.95, 1.08); }
  80% { transform: translateY(0) scale(1.08, 0.9); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes sleep-breath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04, 1.04); }
}
@keyframes dizzy-shake {
  0%, 100% { transform: rotate(-7deg); }
  50% { transform: rotate(7deg); }
}
@keyframes drag-kick {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
@keyframes feet-kick {
  from { transform: rotate(-10deg); }
  to { transform: rotate(10deg); }
}
@keyframes wiggle {
  0%, 100% { transform: rotate(0); }
  30% { transform: rotate(-10deg) translateY(-2px); }
  60% { transform: rotate(8deg); }
}
@keyframes zzz-float {
  0% { opacity: 0; transform: translateY(4px); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}
@keyframes heart-rise {
  0% { opacity: 0; transform: translate(-50%, 4px) scale(0.6); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -18px) scale(1.1); }
}
@keyframes stars-spin {
  from { transform: translateX(-50%) rotate(0deg); }
  to { transform: translateX(-50%) rotate(360deg); }
}
</style>
