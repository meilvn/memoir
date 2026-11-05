import { animate, stagger } from 'animejs'

// 滚动渐显指令：元素进入视口时用 animejs 播放淡入上移动画
// 用法：v-reveal="index * 40"（数字为错峰延迟毫秒数，可省略）
const observer =
  typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const el = entry.target
            observer.unobserve(el)
            const delay = Number(el.dataset.revealDelay || 0)
            animate(el, {
              opacity: [0, 1],
              translateY: [8, 0],
              duration: 240,
              delay,
              easing: 'outExpo',
              onComplete: () => {
                el.style.opacity = ''
                el.style.transform = ''
              },
            })
          })
        },
        { threshold: 0.1, rootMargin: '0px 0px -32px 0px' },
      )
    : null

export const vReveal = {
  mounted(el, binding) {
    if (!observer) {
      return // 无 IO 支持时直接显示
    }
    el.style.opacity = '0'
    el.dataset.revealDelay = String(binding.value ?? 0)
    observer.observe(el)
  },
  beforeUnmount(el) {
    observer?.unobserve(el)
  },
}

// 数字滚动动画（统计页用）：从 0 滚动到目标值
export function countUp(el, target, duration = 1200) {
  if (!el) return
  const obj = { value: 0 }
  animate(obj, {
    value: target,
    duration,
    easing: 'outExpo',
    onUpdate: () => {
      el.textContent = Math.round(obj.value).toLocaleString('zh-CN')
    },
  })
}
