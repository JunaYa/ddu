<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Rect { x: number, y: number, w: number, h: number }
interface ChainNode { rect: Rect, role: string, label: string }
interface Session {
  mode: 'auto' | 'window'
  axAvailable: boolean
  monitor: Rect
  scaleFactor: number
  snapshotDataUrl: string
}
interface HitTest { chain: ChainNode[], appName: string }

const HIT_TEST_THROTTLE_MS = 30
const DRAG_THRESHOLD_PX = 4

const session = ref<Session | null>(null)
const chain = ref<ChainNode[]>([])
const chainIndex = ref(0)
const appName = ref('')
const dragging = ref(false)
const dragStart = ref<{ x: number, y: number } | null>(null)
const dragRect = ref<Rect | null>(null)
const finalizing = ref(false)

let hitTestInFlight = false
let lastHitTestAt = 0

function rectEq(a?: Rect, b?: Rect) {
  if (!a || !b) return false
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
    && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5
}

// Convert a global logical rect to overlay-local CSS pixels (1:1 with logical
// points inside the webview).
function toLocal(r: Rect): Rect {
  const m = session.value!.monitor
  return { x: r.x - m.x, y: r.y - m.y, w: r.w, h: r.h }
}

const highlight = computed<Rect | null>(() => {
  if (dragging.value) return dragRect.value
  const node = chain.value[chainIndex.value]
  return node && session.value ? toLocal(node.rect) : null
})

const label = computed(() => {
  const r = highlight.value
  if (!r) return ''
  const size = `${Math.round(r.w)} × ${Math.round(r.h)}`
  if (dragging.value) return size
  const node = chain.value[chainIndex.value]
  return [size, appName.value, node?.role].filter(Boolean).join(' · ')
})

const veilPath = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let d = `M0,0 H${vw} V${vh} H0 Z`
  const r = highlight.value
  if (r) d += ` M${r.x},${r.y} h${r.w} v${r.h} h${-r.w} Z`
  return d
})

const hudStyle = computed(() => {
  const r = highlight.value
  if (!r) return {}
  const below = r.y + r.h + 8
  const top = below + 28 > window.innerHeight ? Math.max(r.y - 34, 8) : below
  const left = Math.min(Math.max(r.x, 8), window.innerWidth - 240)
  return { top: `${top}px`, left: `${left}px` }
})

async function onMouseMove(e: MouseEvent) {
  if (finalizing.value || !session.value) return

  if (dragStart.value) {
    const dx = e.clientX - dragStart.value.x
    const dy = e.clientY - dragStart.value.y
    if (dragging.value || Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      dragging.value = true
      dragRect.value = {
        x: Math.min(dragStart.value.x, e.clientX),
        y: Math.min(dragStart.value.y, e.clientY),
        w: Math.abs(dx),
        h: Math.abs(dy),
      }
    }
    return
  }

  const now = performance.now()
  if (hitTestInFlight || now - lastHitTestAt < HIT_TEST_THROTTLE_MS) return
  hitTestInFlight = true
  lastHitTestAt = now
  try {
    const m = session.value.monitor
    const res = await invoke<HitTest>('smart_capture_hit_test', { x: m.x + e.clientX, y: m.y + e.clientY })
    const prevDeepest = chain.value[0]?.rect
    chain.value = res.chain
    appName.value = res.appName
    if (!rectEq(prevDeepest, res.chain[0]?.rect)) {
      // New element under the cursor: reset to the mode default granularity.
      chainIndex.value = session.value.mode === 'window' ? Math.max(res.chain.length - 1, 0) : 0
    }
    else {
      chainIndex.value = Math.min(chainIndex.value, Math.max(res.chain.length - 1, 0))
    }
  }
  catch {
    // Session gone (finalize/cancel raced): ignore.
  }
  finally {
    hitTestInFlight = false
  }
}

function onWheel(e: WheelEvent) {
  if (dragging.value || !chain.value.length) return
  if (e.deltaY < 0) chainIndex.value = Math.min(chainIndex.value + 1, chain.value.length - 1)
  else chainIndex.value = Math.max(chainIndex.value - 1, 0)
}

function onMouseDown(e: MouseEvent) {
  if (e.button === 0) dragStart.value = { x: e.clientX, y: e.clientY }
}

async function onMouseUp() {
  if (finalizing.value || !session.value) return
  const wasDragging = dragging.value
  const rect = dragRect.value
  dragStart.value = null
  dragging.value = false
  dragRect.value = null
  if (wasDragging && rect) {
    const m = session.value.monitor
    await finalize({ x: m.x + rect.x, y: m.y + rect.y, w: rect.w, h: rect.h })
  }
  else {
    const node = chain.value[chainIndex.value]
    if (node) await finalize(node.rect)
  }
}

async function finalize(rect: Rect) {
  finalizing.value = true
  try {
    // Fire-and-forget: Rust closes this window as part of finalize.
    await invoke('smart_capture_finalize', { x: rect.x, y: rect.y, w: rect.w, h: rect.h })
  }
  catch (err) {
    // Rust closes the overlay on every finalize path; recovering here is
    // defense-in-depth so a failed IPC call can never freeze the overlay.
    console.error('finalize failed:', err)
    finalizing.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    invoke('smart_capture_cancel')
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    const node = chain.value[chainIndex.value]
    if (node) finalize(node.rect)
  }
}

function openAxPrefs() {
  // Shows the one-time system prompt; falls back to opening the
  // Accessibility pane in System Settings when already denied.
  invoke('permission_request', { kind: 'accessibility' })
}

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  try {
    session.value = await invoke<Session>('smart_capture_get_session')
  }
  catch (err) {
    // No session (stale overlay): bail out cleanly.
    console.error('no capture session:', err)
    invoke('smart_capture_cancel')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div
    class="capture-overlay"
    @mousemove="onMouseMove"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @wheel.prevent="onWheel"
    @contextmenu.prevent
  >
    <img v-if="session" :src="session.snapshotDataUrl" class="snapshot" draggable="false" alt="">
    <svg v-if="session" class="veil">
      <path :d="veilPath" fill="rgba(0, 0, 0, 0.35)" fill-rule="evenodd" />
      <rect
        v-if="highlight"
        :x="highlight.x"
        :y="highlight.y"
        :width="highlight.w"
        :height="highlight.h"
        fill="none"
        stroke="var(--c-primary)"
        stroke-width="2"
      />
    </svg>
    <div v-if="highlight && label" class="hud" :style="hudStyle">
      {{ label }}
    </div>
    <button v-if="session && !session.axAvailable" class="ax-chip" @mousedown.stop @mouseup.stop @click.stop="openAxPrefs">
      开启辅助功能可识别页面模块
    </button>
  </div>
</template>

<style scoped>
.capture-overlay {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #000;
  cursor: crosshair;
  user-select: none;
}

.snapshot,
.veil {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  pointer-events: none;
}

.ax-chip {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
</style>
