<script setup>
/* ==========================================================================
   Import e routing
   ========================================================================= */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

/* ==========================================================================
   Firestore
   ========================================================================= */
import { db } from '@/firebase/config'
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'

/* ==========================================================================
   Stato view
   ========================================================================= */
const route = useRoute()
const router = useRouter()
const project = ref(null)
const loading = ref(true)
const notFound = ref(false)
const activeIndex = ref(0)

// Navigazione tra progetti (ID ordinati)
const orderedIds = ref([])
const currentIndexInList = computed(() => {
  return orderedIds.value.indexOf(String(route.params.id || '').trim())
})
const nextProjectId = computed(() => {
  if (currentIndexInList.value !== -1 && currentIndexInList.value < orderedIds.value.length - 1) {
    return orderedIds.value[currentIndexInList.value + 1]
  }
  return null
})

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

window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

/* ==========================================================================
   Normalizzazione gallery e Immagini
   ========================================================================= */
const galleryPairs = computed(() => {
  const g = project.value?.gallery
  if (!Array.isArray(g)) return []
  return g
    .map((it) => {
      if (it && typeof it === 'object') {
        const hi = (it.high_res || '').trim()
        const lo = (it.low_res || '').trim()
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
   Navigazione Carosello
   ========================================================================= */
const setActive = (i) => { activeIndex.value = i }
const prev = () => { if (activeIndex.value > 0) activeIndex.value-- }
const next = () => { if (activeIndex.value < images.value.length - 1) activeIndex.value++ }

// Spostamento assistito miniature bloccato su mobile per prevenire la trottola
watch(activeIndex, () => {
  if (window.innerWidth <= 768) return

  const container = document.querySelector('.thumbs')
  const activeThumb = document.querySelector('.thumb.active')
  if (container && activeThumb) {
    const containerLeft = container.scrollLeft
    const containerRight = containerLeft + container.offsetWidth
    const thumbLeft = activeThumb.offsetLeft
    const thumbRight = thumbLeft + activeThumb.offsetWidth

    if (thumbLeft < containerLeft || thumbRight > containerRight) {
      const scrollLeft = thumbLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }
})

/* ==========================================================================
   Logica Click & Drag con il Mouse per Desktop
   ========================================================================= */
let isDown = false
let startXScroll
let scrollLeftStart

const onMousedown = (e) => {
  const container = document.querySelector('.thumbs')
  if (!container) return
  isDown = true
  container.classList.add('dragging')
  startXScroll = e.pageX - container.offsetLeft
  scrollLeftStart = container.scrollLeft
}

const onMouseleave = () => {
  const container = document.querySelector('.thumbs')
  isDown = false
  if (container) container.classList.remove('dragging')
}

const onMouseup = () => {
  const container = document.querySelector('.thumbs')
  isDown = false
  if (container) container.classList.remove('dragging')
}

const onMousemove = (e) => {
  if (!isDown) return
  e.preventDefault()
  const container = document.querySelector('.thumbs')
  if (!container) return
  const x = e.pageX - container.offsetLeft
  const walk = (x - startXScroll) * 1.5
  container.scrollLeft = scrollLeftStart - walk
}

/* ==========================================================================
   Gestione dei Colori Dinamici
   ========================================================================= */
const CATEGORY_COLORS = {
  'motion graphics': { bg: '#fff3bf', bd: '#ffd43b', fg: '#7a5b00' },
  'web design': { bg: '#e7f5ff', bd: '#74c0fc', fg: '#1c4f80' },
  'communication': { bg: '#ffe3e3', bd: '#ffa8a8', fg: '#7a1f1f' },
  'case studies': { bg: '#e6f4ea', bd: '#81c995', fg: '#137333' },
  'visual design': { bg: '#f3f0ff', bd: '#d0bfff', fg: '#5f3dc4' },
  'other': { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

const tagStyle = computed(() => {
  const catNormalized = String(project.value?.category || '').trim().toLowerCase()
  const c = CATEGORY_COLORS[catNormalized] || CATEGORY_COLORS['other']
  return {
    background: c.bg,
    borderColor: c.bd,
    color: c.fg
  }
})

/* ==========================================================================
   Fetch dati
   ========================================================================= */
async function fetchProjectData() {
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

    if (orderedIds.value.length === 0) {
      const colRef = collection(db, 'projects')
      const q = query(colRef, orderBy('order', 'asc'))
      const listSnap = await getDocs(q)
      const ids = []
      listSnap.forEach((doc) => ids.push(doc.id))
      orderedIds.value = ids
    }
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchProjectData)
watch(() => route.params.id, fetchProjectData)
</script>

<template>
  <main class="page bg-surface text-text">

    <div v-if="loading" class="loading py-40 text-center opacity-80" role="status" aria-live="polite">
      Caricamento progetto…
    </div>

    <div v-else-if="notFound" class="notfound py-40 text-center opacity-80" role="alert">
      <p>Progetto non trovato.</p>
      <RouterLink to="/projects" class="back-link text-accent">Torna ai progetti</RouterLink>
    </div>

    <div v-else-if="project" class="container max-w-[1200px] mx-auto relative">

      <div class="top-nav-bar flex justify-between items-center w-full absolute -top-[60px] left-0 px-1">
        <RouterLink to="/projects" class="back-btn w-12 h-12 inline-flex items-center justify-center bg-transparent"
          aria-label="Torna alla lista progetti" title="Torna alla lista progetti">
          <img src="/icone/icon-arrowsx.svg" alt="" aria-hidden="true" class="icon w-6 h-6 block" />
          <span class="sr-only">Torna alla lista progetti</span>
        </RouterLink>

        <RouterLink v-if="nextProjectId" :to="{ name: 'project-details', params: { id: nextProjectId } }"
          class="next-project-btn w-12 h-12 inline-flex items-center justify-center bg-transparent"
          aria-label="Vai al progetto successivo" title="Vai al progetto successivo">
          <img src="/icone/icon-arrowdx.svg" alt="" aria-hidden="true" class="icon w-6 h-6 block" />
          <span class="sr-only">Progetto successivo</span>
        </RouterLink>
        <div v-else class="w-12 h-12 opacity-0 pointer-events-none"></div>
      </div>

      <h1 class="title text-accent text-center">{{ project.title }}</h1>

      <section class="viewer grid grid-cols-[48px_1fr_48px] items-center gap-4 md:gap-6 mb-14"
        aria-label="Visualizzatore elementi del progetto">

        <button
          class="nav w-12 h-12 bg-transparent inline-flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent"
          type="button" :disabled="activeIndex === 0" @click="prev" aria-label="Elemento precedente"
          title="Elemento precedente">
          <img src="/icone/icon-prev.svg" alt="" aria-hidden="true" class="icon w-6 h-6 block pointer-events-none" />
        </button>

        <div class="stage bg-surface grid place-items-center overflow-hidden w-full">
          <iframe v-if="images[activeIndex]?.type === 'video'" :src="images[activeIndex].src"
            title="YouTube video player" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen class="block w-full max-w-[1080px] aspect-video rounded-lg mx-auto"></iframe>

          <img v-else :src="images[activeIndex]?.src" :alt="images[activeIndex]?.alt"
            class="stage-img block h-[clamp(18rem,60vh,45rem)] w-auto max-w-full object-contain mx-auto"
            loading="eager" />
        </div>

        <button
          class="nav w-12 h-12 bg-transparent inline-flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent"
          type="button" :disabled="activeIndex === images.length - 1" @click="next" aria-label="Immagine successiva"
          title="Immagine successiva">
          <img src="/icone/icon-next.svg" alt="" aria-hidden="true" class="icon w-6 h-6 block pointer-events-none" />
        </button>

      </section>

      <section v-if="thumbs.length > 1" class="thumbs-container mb-14 overflow-hidden">
        <div class="thumbs flex gap-4 no-scrollbar px-4 md:px-20" role="list" aria-label="Miniature della galleria"
          @mousedown="onMousedown" @mouseleave="onMouseleave" @mouseup="onMouseup" @mousemove="onMousemove">
          <button v-for="(t, i) in thumbs" :key="t.src + i"
            class="thumb flex-shrink-0 w-[112px] h-[112px] rounded-lg overflow-hidden border-2 transition"
            :class="{ 'active': i === activeIndex }" @click="setActive(i)" :aria-label="'Mostra immagine ' + (i + 1)"
            :title="'Mostra immagine ' + (i + 1)" :aria-current="i === activeIndex ? 'true' : 'false'" role="listitem">
            <img :src="t.src" :alt="t.alt" class="w-full h-full object-cover pointer-events-none" />
          </button>
        </div>
      </section>

      <section class="meta grid grid-cols-[1fr_2fr] gap-[72px] pt-10 border-t border-black/5 dark:border-white/5"
        aria-label="Scheda informativa del progetto">
        <div class="col">
          <dl class="meta-list">
            <dt v-if="project.year" class="meta-label">Data</dt>
            <dd v-if="project.year">
              <p>{{ project.year }}</p>
            </dd>

            <dt v-if="project.drive_url" class="meta-label">Link di progetto</dt>
            <dd v-if="project.drive_url">
              <p>
                <a :href="project.drive_url" target="_blank" rel="noopener noreferrer"
                  class="external-link sidebar-link" aria-label="Visualizza i materiali aggiuntivi su Drive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                    stroke-linejoin="round" class="w-4 h-4" aria-hidden="true">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Materiali aggiuntivi</span>
                </a>
              </p>
            </dd>

            <dt class="meta-label">Tipo di progetto</dt>
            <dd>
              <p><span class="pill inline-block" :style="tagStyle">{{ project.category || 'Other' }}</span></p>
            </dd>

            <dt v-if="project.tag?.length" class="meta-label">Tag</dt>
            <dd v-if="project.tag?.length">
              <ul class="tags flex flex-wrap gap-3 list-none p-0" aria-label="Tag del progetto">
                <li v-for="(t, i) in project.tag" :key="i" class="pill" :style="tagStyle">{{ t }}</li>
              </ul>
            </dd>

            <dt class="meta-label">Tecnica (Tools)</dt>
            <dd>
              <p v-if="project.tools">{{ project.tools }}</p>
              <p v-else class="opacity-50">Dati non disponibili</p>
            </dd>
          </dl>
        </div>

        <div class="col">
          <h2 class="meta-label">Descrizione</h2>
          <div v-if="project.description" class="desc leading-relaxed">
            <p v-html="project.description"></p>
            <div v-if="project.drive_url" class="external-links-wrapper mt-8">
              <a :href="project.drive_url" target="_blank" rel="noopener noreferrer" class="external-link"
                aria-label="Visualizza i materiali aggiuntivi su Drive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" class="w-4 h-4" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Visualizza materiali aggiuntivi su Drive</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>

<style scoped>
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.top-nav-bar {
  width: 100%;
}

.back-btn,
.next-project-btn {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  cursor: pointer;
}

.back-btn img,
.next-project-btn img {
  transition: transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.back-btn:hover img {
  transform: translateX(-4px);
}

.next-project-btn:hover img {
  transform: translateX(4px);
}

.external-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-accent);
  text-decoration: underline;
  transition: color 0.2s ease;
  font-size: 0.875rem;
}

.external-link:hover {
  color: var(--color-hover);
}

.external-links-wrapper {
  margin-top: 2rem;
}

.page {
  padding: 48px var(--margin-desktop) 112px;
}

.title {
  font-size: clamp(2rem, 4.2vw, 3.5rem);
  line-height: 1.1;
  margin: 56px 0 48px;
}

.nav {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.nav:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05) !important;
  transform: scale(1.05);
}

.nav:active:not(:disabled) {
  transform: scale(0.95);
}

:global(.dark) .nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1) !important;
}

.thumbs-container {
  width: 100%;
}

.thumbs {
  -ms-overflow-style: none;
  scrollbar-width: none;
  overflow-x: auto;
}

/* CORRETTO: Isolata la transizione solo su opacity e bloccata la dissolvenza del colore */
.thumb {
  border: 2px solid var(--color-text) !important;
  opacity: 0.7;
  transition: opacity 0.2s ease !important;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: block;
}

/* CORRETTO: Quando è selezionata scatta all'istante diventando viola senza ritardi */
.thumb.active {
  border-color: var(--color-accent) !important;
  opacity: 100 !important;
  transition: none !important;
}

.thumb img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.meta-list {
  margin: 0;
  padding: 0;
}

/* AGGIORNATO CON LE TUE SPECIFICHE: Uniformato per rispecchiare lo stile esatto dei titoli anche senza tag H2 */
.meta-label {
  font-size: clamp(1.25rem, 1.9vw, 1.5rem);
  margin-bottom: 12px;
  font-family: var(--font-heading);
  font-style: normal;
  font-weight: 700;
  color: var(--color-accent);
}

.desc p,
.meta-list dd p {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
  line-height: 1.8;
  margin-bottom: 14px;
  white-space: pre-line;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: var(--font-weight-semibold);
  line-height: normal;
  border: 1px solid currentColor;
}

/* ==========================================================================
   VERSIONE MOBILE ADATTATA
   ========================================================================= */
@media (max-width: 768px) {
  .page {
    padding: 48px var(--margin-mobile) 96px;
  }

  .title {
    margin: 56px 0 48px;
    font-size: 2.2rem;
  }

  .viewer {
    grid-template-columns: 40px 1fr 40px;
    gap: 8px;
    margin-bottom: 24px;
  }

  .nav {
    width: 40px;
    height: 40px;
    position: static !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: normal !important;
  }

  .nav img {
    width: 20px;
    height: 20px;
  }

  .stage-img {
    height: 45vh !important;
  }

  .thumbs {
    padding-inline: 4px;
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .meta-list dt {
    margin-top: 24px;
  }

  .meta-list dt:first-child {
    margin-top: 0;
  }

  .meta-label {
    margin-bottom: 6px;
  }

  .meta-list dd p {
    margin-bottom: 0;
  }
}
</style>