<script setup>
/* ==========================================================================
   Import e routing
   ========================================================================= */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

/* ==========================================================================
   Firestore
   ========================================================================= */
import { db } from '@/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

/* ==========================================================================
   Stato view
   ========================================================================= */
const route = useRoute()
const project = ref(null)
const loading = ref(true)
const notFound = ref(false)
const activeIndex = ref(0)

/* ==========================================================================
   Helpers
   ========================================================================= */
const isImgUrl = (u) =>
  typeof u === 'string' && /\.(webp|png|jpe?g|gif|avif)$/i.test((u || '').trim())

const normKey = (u) => {
  if (typeof u !== 'string') return ''
  const clean = u.trim().toLowerCase().split('?')[0]
  const file = clean.split('/').pop() || ''
  return file.replace(/\.(webp|png|jpe?g|gif|avif)$/i, '')
}

/* Scroll iniziale */
window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

/* ==========================================================================
   Normalizzazione gallery e Immagini (Riconoscimento Automatico Video/Immagini)
   ========================================================================= */
const galleryPairs = computed(() => {
  const g = project.value?.gallery
  if (!Array.isArray(g)) return []
  return g
    .map((it) => {
      if (it && typeof it === 'object') {
        const hi = (it.high_res || '').trim()
        const lo = (it.low_res || '').trim()

        // Verifica se l'URL appartiene a un video di YouTube
        const isVideo = hi.includes('youtube.com') || hi.includes('youtu.be')

        return {
          type: isVideo ? 'video' : 'image',
          hi,
          lo: lo || hi
        }
      }
      if (typeof it === 'string') {
        const s = it.trim()
        const isVideo = s.includes('youtube.com') || s.includes('youtu.be')
        return { type: isVideo ? 'video' : 'image', hi: s, lo: s }
      }
      return { type: 'image', hi: '', lo: '' }
    })
    .filter((p) => p.hi || p.lo)
})

const images = computed(() => {
  if (!project.value) return []
  const out = []
  const added = new Set()
  const coverRaw = (project.value.main_image?.trim?.() || project.value.img || '').trim()

  if (isImgUrl(coverRaw)) {
    const coverKey = normKey(coverRaw)
    const hiResMatch = galleryPairs.value.find(p => p.type === 'image' && normKey(p.hi) === coverKey)
    out.push({
      type: 'image',
      src: hiResMatch ? hiResMatch.hi : coverRaw,
      alt: `${project.value.title} – cover`
    })
    added.add(coverKey)
  }

  for (const p of galleryPairs.value) {
    if (p.type === 'video') {
      out.push({ type: 'video', src: p.hi, alt: `${project.value.title} – video` })
    } else {
      const src = p.hi?.trim()
      if (!isImgUrl(src)) continue
      const key = normKey(src)
      if (!added.has(key)) {
        out.push({ type: 'image', src, alt: `${project.value.title} – immagine` })
        added.add(key)
      }
    }
  }
  return out
})

const thumbs = computed(() => {
  if (!project.value) return []
  const out = []
  const added = new Set()
  const loByKey = new Map()

  for (const p of galleryPairs.value) {
    if (p.type === 'image') {
      const lo = isImgUrl(p.lo) ? p.lo : (isImgUrl(p.hi) ? p.hi : '')
      if (lo) loByKey.set(normKey(p.hi || lo), lo)
    }
  }

  const cover = (project.value.main_image?.trim?.() || project.value.img || '').trim()
  if (isImgUrl(cover)) {
    const coverKey = normKey(cover)
    const coverThumb = loByKey.get(coverKey) || cover
    out.push({ src: coverThumb, alt: `${project.value.title} – cover` })
    added.add(normKey(coverThumb))
    added.add(coverKey)
  }

  for (const p of galleryPairs.value) {
    if (p.type === 'video') {
      out.push({ src: p.lo, alt: `${project.value.title} – miniatura video` })
    } else {
      const candidate = isImgUrl(p.lo) ? p.lo : (isImgUrl(p.hi) ? p.hi : '')
      if (candidate && !added.has(normKey(candidate))) {
        out.push({ src: candidate, alt: `${project.value.title} – miniatura` })
        added.add(normKey(candidate))
      }
    }
  }
  return out
})

/* ==========================================================================
   Navigazione e Auto-scroll miniature
   ========================================================================= */
const setActive = (i) => { activeIndex.value = i }
const prev = () => { if (activeIndex.value > 0) activeIndex.value-- }
const next = () => { if (activeIndex.value < images.value.length - 1) activeIndex.value++ }

watch(activeIndex, async () => {
  const container = document.querySelector('.thumbs')
  const activeThumb = document.querySelector('.thumb.active')
  if (container && activeThumb) {
    const scrollLeft = activeThumb.offsetLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }
})

/* ==========================================================================
   Swipe touch
   ========================================================================= */
const startX = ref(0)
const deltaX = ref(0)

const onTouchStart = (e) => {
  startX.value = e.changedTouches[0].clientX
  deltaX.value = 0
}

const onTouchMove = (e) => {
  deltaX.value = e.changedTouches[0].clientX - startX.value
}

const onTouchEnd = () => {
  if (Math.abs(deltaX.value) > 45) {
    deltaX.value < 0 ? next() : prev()
  }
}

/* ==========================================================================
   Gestione dei Colori Dinamici (Insensibile alle Maiuscole/Minuscole)
   ========================================================================= */
const CATEGORY_COLORS = {
  'visual design': { bg: '#fff3bf', bd: '#ffd43b', fg: '#7a5b00' },
  'web design': { bg: '#e7f5ff', bd: '#74c0fc', fg: '#1c4f80' },
  'communication': { bg: '#ffe3e3', bd: '#ffa8a8', fg: '#7a1f1f' },
  'case studies': { bg: '#e6f4ea', bd: '#81c995', fg: '#137333' },
  'motion graphics': { bg: '#f3f0ff', bd: '#d0bfff', fg: '#5f3dc4' },
  'other': { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

const tagStyle = computed(() => {
  // Convertiamo la categoria in minuscolo per evitare errori di battitura tra codice e database
  const catNormalized = String(project.value?.category || '').trim().toLowerCase()
  const c = CATEGORY_COLORS[catNormalized] || CATEGORY_COLORS['other']
  return {
    background: c.bg,
    borderColor: c.bd,
    color: c.fg
  }
})

/* ==========================================================================
   Fetch progetto
   ========================================================================= */
async function fetchProject() {
  loading.value = true
  notFound.value = false
  project.value = null
  activeIndex.value = 0
  const id = String(route.params.id || '').trim()

  try {
    const snap = await getDoc(doc(db, 'projects', id))
    if (!snap.exists()) {
      notFound.value = true
      return
    }
    project.value = { id: snap.id, ...snap.data() }
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchProject)
watch(() => route.params.id, fetchProject)
</script>

<template>
  <main class="page bg-surface text-text">

    <div v-if="loading" class="loading py-40 text-center opacity-80">
      Caricamento progetto…
    </div>

    <div v-else-if="notFound" class="notfound py-40 text-center opacity-80">
      <p>Progetto non trovato.</p>
      <RouterLink to="/projects" class="back-link text-accent">Torna ai progetti</RouterLink>
    </div>

    <div v-else-if="project" class="container max-w-[1200px] mx-auto relative">

      <RouterLink to="/projects"
        class="back-btn absolute -top-[60px] left-0 w-12 h-12 inline-flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Torna alla lista progetti" title="Torna alla lista progetti">
        <img src="/icone/icon-arrowsx.svg" alt="" aria-hidden="true" class="icon w-6 h-6" />
      </RouterLink>

      <h1 class="title text-accent text-center">{{ project.title }}</h1>

      <section class="viewer grid grid-cols-[48px_1fr_48px] items-center gap-6 mb-14">

        <button
          class="nav w-12 h-12 inline-flex items-center justify-center transition disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10"
          :disabled="activeIndex === 0" @click="prev" aria-label="Immagine precedente" title="Immagine precedente">
          <img src="/icone/icon-prev.svg" alt="" aria-hidden="true" class="w-6 h-6" />
        </button>

        <div class="stage bg-surface grid place-items-center overflow-hidden w-full" @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove" @touchend="onTouchEnd">
          <iframe v-if="images[activeIndex]?.type === 'video'" :src="images[activeIndex].src"
            title="YouTube video player" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen class="block w-full max-w-[1080px] aspect-video rounded-lg mx-auto"></iframe>

          <img v-else :src="images[activeIndex]?.src" :alt="images[activeIndex]?.alt"
            class="stage-img block h-[clamp(360px,62vh,720px)] w-auto max-w-full object-contain" loading="eager" />
        </div>

        <button
          class="nav w-12 h-12 inline-flex items-center justify-center transition disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10"
          :disabled="activeIndex === images.length - 1" @click="next" aria-label="Immagine successiva"
          title="Immagine successiva">
          <img src="/icone/icon-next.svg" alt="" aria-hidden="true" class="w-6 h-6" />
        </button>

      </section>

      <section v-if="thumbs.length > 1"
        class="thumbs flex gap-4 overflow-x-auto scroll-smooth no-scrollbar mb-14 px-20">
        <button v-for="(t, i) in thumbs" :key="t.src + i"
          class="thumb flex-shrink-0 w-[112px] h-[112px] rounded-lg overflow-hidden border-2 transition opacity-70"
          :class="{ 'active opacity-100 border-[var(--color-accent)]': i === activeIndex }" @click="setActive(i)"
          :aria-label="'Mostra elemento ' + (i + 1)" :title="'Mostra elemento ' + (i + 1)">
          <img :src="t.src" :alt="t.alt" class="w-full h-full object-cover" />
        </button>
      </section>

      <section class="meta grid grid-cols-[1fr_2fr] gap-[72px] pt-10 border-t border-black/5 dark:border-white/5">

        <div class="col">
          <h3 class="text-accent">Data</h3>
          <p v-if="project.year">{{ project.year }}</p>

          <h3 class="text-accent mt-6">Tipo di progetto</h3>
          <p><span class="pill inline-block" :style="tagStyle">{{ project.category || 'Other' }}</span></p>

          <h3 class="text-accent mt-6">Tag</h3>
          <ul v-if="project.tag?.length" class="tags flex flex-wrap gap-3 list-none p-0">
            <li v-for="(t, i) in project.tag" :key="i" class="pill" :style="tagStyle">
              {{ t }}
            </li>
          </ul>

          <h3 class="text-accent mt-6">Tecnica (Tools)</h3>
          <p v-if="project.tools">{{ project.tools }}</p>
          <p v-else class="opacity-50">Dati non disponibili</p>
        </div>

        <div class="col">
          <h3 class="text-accent">Description:</h3>
          <div v-if="project.description" class="desc leading-relaxed">
            <p v-html="project.description"></p>
            <div v-if="project.behance_url" class="mt-8">
              <a :href="project.behance_url" target="_blank" rel="noopener noreferrer" class="behance-link">
                <img src="/icone/icon-behance.svg" alt="" aria-hidden="true" class="w-4 h-4" />
                <span>Scopri il video presentazione su Behance</span>
              </a>
            </div>
          </div>
        </div>

      </section>

    </div>
  </main>
</template>

<style scoped>
/* Behance Style */
.behance-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  text-decoration: underline;
  transition: color 0.2s ease;
  font-size: 14px;
}

.behance-link:hover {
  color: var(--color-hover);
}

/* Layout */
.page {
  padding: 48px var(--margin-desktop) 112px;
}

.title {
  font-size: clamp(32px, 4.2vw, 56px);
  line-height: 1.1;
  margin: 56px 0 48px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Tipografia Meta */
.meta h3 {
  font-size: clamp(20px, 1.9vw, 24px);
  margin-bottom: 12px;
  font-weight: 700;
}

.desc p,
.col p {
  font-size: clamp(15px, 1.05vw, 18px);
  line-height: 1.8;
  margin-bottom: 14px;
  white-space: pre-line;
}

.pill {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  border: 1px solid currentColor;
}

/* Responsiveness */
@media (max-width: 768px) {
  .page {
    padding: 32px var(--margin-mobile) 96px;
  }

  .viewer {
    grid-template-columns: 1fr;
  }

  .nav {
    display: none;
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>