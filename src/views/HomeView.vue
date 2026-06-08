<script setup>
/* ==========================================================================
   Import e Stato
   ========================================================================== */
import { RouterLink } from 'vue-router'
import Handwave from '@/components/Handwave.vue'

import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'

import { db } from '@/firebase/config'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'

/* Stato base */
const loading = ref(true)
const error = ref(null)
const projects = ref([])
const illustrations = ref([])

/* ==========================================================================
   Scroll iniziale
   - Garantisce l’avvio view dall’inizio pagina
   ========================================================================== */
window.scrollTo({ top: 0, left: 0, behavior: 'instant' })


/* Slider progetti */
const projViewport = ref(null)
const projTrack = ref(null)
const projIndex = ref(0)

const CARD_GAP = 14
const cardWidth = ref(0)
const visibleCount = ref(1)

const projMaxIndex = computed(() =>
  Math.max(0, (projects.value.length || 0) - visibleCount.value)
)
const projPrevDisabled = computed(() => projIndex.value <= 0)
const projNextDisabled = computed(() => projIndex.value >= projMaxIndex.value)

async function fetchProjects() {
  const q =
    query(
      collection(db, 'projects'),
      where('featured', '==', true),
      orderBy('priority', 'asc'),
      limit(4)
    )
  const snap = await getDocs(q)
  projects.value = snap.docs.map(d => ({
    firestoreId: d.id,
    ...d.data()
  }))
}

function measureCarousel() {
  const vp = projViewport.value
  const tr = projTrack.value
  if (!vp || !tr) return

  const first = tr.querySelector('.card')
  if (!first) {
    cardWidth.value = 0
    visibleCount.value = 1
    return
  }

  cardWidth.value = Math.max(1, Math.round(first.getBoundingClientRect().width))
  const vpWidth = Math.max(1, Math.round(vp.getBoundingClientRect().width))

  visibleCount.value = Math.max(
    1,
    Math.floor((vpWidth + CARD_GAP) / (cardWidth.value + CARD_GAP))
  )

  projIndex.value = Math.min(projIndex.value, projMaxIndex.value)
  applyTransform()
}

function applyTransform() {
  const tr = projTrack.value
  if (!tr) return
  const step = cardWidth.value + CARD_GAP
  tr.style.transform = `translateX(${-projIndex.value * step}px)`
}

function prevProj() {
  if (!projPrevDisabled.value) {
    projIndex.value -= 1
    applyTransform()
  }
}

function nextProj() {
  if (!projNextDisabled.value) {
    projIndex.value += 1
    applyTransform()
  }
}

/* Slider illustrazioni */
const illViewport = ref(null)
const illTrack = ref(null)
const illSnaps = ref([])
const illSnapIndex = ref(0)

const illPrevDisabled = computed(() => illSnapIndex.value <= 0)
const illNextDisabled = computed(() =>
  illSnapIndex.value >= Math.max(0, illSnaps.value.length - 1)
)

async function fetchIllustrations() {
  const q =
    query(
      collection(db, 'illustrations'),
      where('featured', '==', true),
      orderBy('priority', 'asc'),
      limit(6)
    )
  const snap = await getDocs(q)
  illustrations.value = snap.docs.map(d => ({
    firestoreId: d.id,
    ...d.data()
  }))
}

function measureIllCarousel() {
  const vp = illViewport.value
  const tr = illTrack.value
  if (!vp || !tr) return

  const vpWidth = Math.round(vp.clientWidth)
  const trackWidth = Math.round(tr.scrollWidth)
  const maxOffset = Math.max(0, trackWidth - vpWidth)

  const children = Array.from(tr.children)
  const rawSnaps = children.map(el => Math.min(el.offsetLeft, maxOffset))
  const unique = [...new Set(rawSnaps)].sort((a, b) => a - b)
  illSnaps.value = unique

  const current = illSnaps.value[illSnapIndex.value] ?? 0
  const nearestIndex = nearestSnapIndex(current, illSnaps.value)
  illSnapIndex.value = Math.min(
    nearestIndex,
    Math.max(0, illSnaps.value.length - 1)
  )

  applyIllTransform()
}

function nearestSnapIndex(value, snaps) {
  if (!snaps.length) return 0
  let best = 0
  let bestDist = Math.abs(snaps[0] - value)
  for (let i = 1; i < snaps.length; i++) {
    const d = Math.abs(snaps[i] - value)
    if (d < bestDist) {
      best = i
      bestDist = d
    }
  }
  return best
}

function applyIllTransform() {
  const tr = illTrack.value
  if (!tr || !illSnaps.value.length) return
  const offset = illSnaps.value[illSnapIndex.value] || 0
  tr.style.transform = `translateX(${-offset}px)`
}

function prevIll() {
  if (!illPrevDisabled.value) {
    illSnapIndex.value -= 1
    applyIllTransform()
  }
}

function nextIll() {
  if (!illNextDisabled.value) {
    illSnapIndex.value += 1
    applyIllTransform()
  }
}

/* Lifecycle */
let onResize

onMounted(async () => {
  try {
    await Promise.all([fetchProjects(), fetchIllustrations()])
    await nextTick()
    measureCarousel()
    measureIllCarousel()

    onResize = () => {
      measureCarousel()
      measureIllCarousel()
    }

    window.addEventListener('resize', onResize, { passive: true })

    setTimeout(() => {
      measureCarousel()
      measureIllCarousel()
    }, 120)
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => window.removeEventListener('resize', onResize))

watch(projects, async () => {
  await nextTick()
  measureCarousel()
})

watch(illustrations, async () => {
  await nextTick()
  measureIllCarousel()
})
</script>

<template>
  <main id="main-content" tabindex="-1" class="page-content bg-surface text-text pt-2 pb-16">
    <section class="hero mx-auto max-w-[1280px] px-desktop pt-8 pb-14 grid items-center gap-14" role="region"
      aria-labelledby="home-title">

      <div class="min-w-0">
        <h1 id="home-title" class="title m-0 text-accent font-extrabold leading-[1.1] whitespace-nowrap">
          Anna Cazzanelli
        </h1>

        <h2 class="role m-0 mb-[20px] font-normal leading-[1.28] uppercase whitespace-nowrap text-accent ">
          Digital Designer &amp; Illustratrice
        </h2>

        <p class="payoff mt-2 mb-4 ">
          Se vuoi saperne di più di me
        </p>

        <!-- RIPRISTINATO: Testo originale "Clicca qui" con aria-label accessibile e nessun title -->
        <RouterLink to="/about" class="cta hero-btn whitespace-nowrap"
          aria-label="Clicca qui per saperne di più su Anna Cazzanelli">
          Clicca qui
        </RouterLink>
      </div>

      <div class="hand-wrap justify-self-end -mt-10">
        <Handwave :canvas-width="900" :canvas-height="900" />
      </div>
    </section>

    <section class="mx-auto max-w-[1280px] px-desktop pt-20 pb-6 accent-divider" role="region"
      aria-labelledby="projects-title">
      <h2 id="projects-title" class="section-title mt-5 mb-20 text-accent">
        Alcuni Progetti Digitali
      </h2>

      <div v-if="loading" class="opacity-70" role="status" aria-live="polite">
        Caricamento…
      </div>

      <p v-else-if="error" class="text-[#b00020]" role="alert">
        {{ error }}
      </p>

      <div v-else class="grid grid-cols-[48px_1fr_48px] items-center gap-2">
        <button class="nav" type="button" @click="prevProj" :disabled="projPrevDisabled"
          aria-label="Progetto precedente">
          <img src="/icone/icon-prev.svg" class="icon" alt="" />
        </button>

        <div class="carousel-viewport" ref="projViewport">
          <div class="carousel-track" ref="projTrack" role="list">
            <RouterLink v-for="(p, index) in projects" :key="p.firestoreId" class="card"
              :to="`/projects/${p.firestoreId}`" :aria-label="`Apri progetto: ${p.title || p.firestoreId}`"
              :title="`Apri progetto: ${p.title || 'Senza titolo'}`" role="listitem"
              :aria-hidden="index < projIndex || index >= projIndex + visibleCount ? 'true' : null"
              :tabindex="index < projIndex || index >= projIndex + visibleCount ? '-1' : '0'">

              <div class="card-frame">
                <img :src="p.img || p.main_image"
                  :alt="p.title ? `Anteprima progetto: ${p.title}` : 'Anteprima progetto'" loading="lazy" />
              </div>

              <h3 class="card-title mt-4">
                {{ p.title || 'Senza titolo' }}
              </h3>
            </RouterLink>
          </div>
        </div>

        <button class="nav" type="button" @click="nextProj" :disabled="projNextDisabled" aria-label="Prossimo progetto">
          <img src="/icone/icon-next.svg" class="icon" alt="" />
        </button>
      </div>

      <div class="section-cta-projects -mt-10 flex justify-end">
        <RouterLink to="/projects" class="cta-see-all">
          <span>Vedi tutti i progetti</span>
          <img src="/icone/icon-arrowdx.svg" class="icon" alt="" />
        </RouterLink>
      </div>
    </section>

    <section class="mx-auto max-w-[1280px] px-desktop pt-20 pb-6" role="region" aria-labelledby="illustrations-title">
      <h2 id="illustrations-title" class="section-title mt-5 mb-20 text-accent">
        Alcune illustrazioni
      </h2>

      <div v-if="loading" class="opacity-70" role="status" aria-live="polite">
        Caricamento…
      </div>

      <p v-else-if="error" class="text-[#b00020]" role="alert">
        {{ error }}
      </p>

      <div v-else class="grid grid-cols-[48px_1fr_48px] items-center gap-2">
        <button class="nav" type="button" @click="prevIll" :disabled="illPrevDisabled"
          aria-label="Illustrazione precedente">
          <img src="/icone/icon-prev.svg" class="icon" alt="" />
        </button>

        <div class="carousel-viewport" ref="illViewport">
          <div class="carousel-track" ref="illTrack" role="list">
            <RouterLink v-for="(i, index) in illustrations" :key="i.firestoreId" class="card-illustration"
              :to="`/illustrations/${i.firestoreId}`" :aria-label="`Apri illustrazione: ${i.title || i.firestoreId}`"
              :title="`Apri illustrazione: ${i.title || 'Senza titolo'}`" role="listitem"
              :aria-hidden="index < illSnapIndex || index >= illSnapIndex + 1 ? 'true' : null"
              :tabindex="index < illSnapIndex || index >= illSnapIndex + 1 ? '-1' : '0'">

              <img :src="i.img || i.main_image"
                :alt="i.title ? `Anteprima illustrazione: ${i.title}` : 'Anteprima illustrazione'" loading="lazy" />
            </RouterLink>
          </div>
        </div>

        <button class="nav" type="button" @click="nextIll" :disabled="illNextDisabled"
          aria-label="Prossima illustrazione">
          <img src="/icone/icon-next.svg" class="icon" alt="" />
        </button>
      </div>

      <div class="section-cta-projects -mt-10 flex justify-end">
        <RouterLink to="/illustrations" class="cta-see-all">
          <span>Vedi tutte le illustrazioni</span>
          <img src="/icone/icon-arrowdx.svg" class="icon" alt="" />
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* HERO layout */
.hero {
  display: grid;
  grid-template-columns: 1.2fr clamp(300px, 36vw, 520px);
  scroll-margin-top: 80px;
}

@media (min-width: 1400px) {
  .hero {
    grid-template-columns: 1.1fr clamp(360px, 38vw, 560px);
  }
}

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr clamp(240px, 32vw, 360px);
    gap: 40px;
    padding-inline: var(--margin-mobile);
    scroll-margin-top: 72px;
  }
}

@media (max-width: 600px) {
  .hero {
    grid-template-columns: 1fr clamp(140px, 34vw, 220px);
    gap: 20px;
    scroll-margin-top: 64px;
    padding-inline: var(--margin-mobile);
  }
}

/* Tipografia hero */
.title {
  font-size: clamp(48px, 6.5vw, 84px);
  margin-bottom: 16px;
}

.subtitle {
  font-size: clamp(20px, 3.4vw, 44px);
  letter-spacing: 0.2px;
  font-weight: 700;
}

.role {
  font-size: clamp(18px, 2.8vw, 34px);
  font-weight: 400;
}

.payoff {
  font-size: clamp(16px, 1.4vw, 18px);
  line-height: 1.7;
}

/* Tuning hero mobile */
@media (max-width: 600px) {
  .title {
    font-size: 34px !important;
    margin-bottom: 4px !important;
  }

  .subtitle {
    margin-bottom: 4px;
    line-height: 1.16;
  }

  .role {
    font-size: 15px !important;
    margin-bottom: 16px;
    line-height: 1.25;
    white-space: nowrap !important;
  }

  .payoff {
    white-space: nowrap;
  }
}

/* Dimensioni animazione hero su vari dispositivi */
.hand-wrap {
  width: clamp(300px, 36vw, 520px);
}

@media (min-width: 1400px) {
  .hand-wrap {
    width: clamp(360px, 38vw, 560px);
    margin-top: -30px;
  }
}

@media (max-width: 1024px) {
  .hand-wrap {
    width: clamp(240px, 32vw, 360px);
    margin-top: 140px;
    margin-right: -10px;
  }
}

@media (max-width: 600px) {
  .hand-wrap {
    width: clamp(140px, 34vw, 220px);
    margin-top: 150px;
    margin-right: -20px;
  }
}

@media (max-width: 480px) {
  .hand-wrap {
    width: clamp(140px, 34vw, 220px);
    margin-top: 160px;
    margin-right: -24px;
  }
}


/* CTA hero */
.cta {
  display: inline-block;
  padding: 16px 28px;
  text-decoration: none;
  font-weight: 700;
  font-size: 18px;
  line-height: 1;
  color: var(--color-text);
  border: 1px solid var(--color-accent);
  background-color: color-mix(in srgb, var(--color-accent) 70%, transparent);
  transition:
    transform 0.08s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

@media (max-width: 600px) {
  .cta {
    padding: 12px 22px;
    font-size: 15px;
  }
}

.cta:hover {
  background-color: var(--color-accent);
  color: var(--color-surface);
}

.cta:active {
  transform: scale(0.98);
}

.cta:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}


/* Divider accent */
.accent-divider {
  border-top: 2px solid var(--color-accent);
}

/* Slider */
.section-title {
  font-size: clamp(22px, 2.6vw, 32px);
  line-height: 1.2;
}

@media (max-width: 600px) {
  .section-title {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }
}

.nav {
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.nav:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.nav:active {
  transform: scale(0.96);
}

.nav .icon {
  width: 24px;
  height: 24px;
  display: block;
  pointer-events: none;
}

.nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.carousel-viewport {
  overflow: hidden;
}

.carousel-track {
  display: flex;
  gap: 14px;
  will-change: transform;
  transition: transform 0.35s ease;
}

/* Card progetto */
.card {
  flex: 0 0 auto;
  width: 100%;
  max-width: 350px;
  text-decoration: none;
  color: inherit;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.card-frame {
  background: var(--color-surface);
  margin: 0;
  padding: 10px;
  display: grid;
  place-items: center;
}

.card-frame img {
  display: block;
  width: 100%;
  height: 220px;
  object-fit: contain;
  background-color: var(--color-surface);
}

.card-title {
  margin: 12px 8px 0;
  font-size: 1.5rem;
  line-height: 1.5;
  font-weight: 700;
  text-align: center;
  color: var(--color-accent);
}

.card:hover .card-title {
  color: var(--color-hover);
}

/* Card illustrazione */
.card-illustration {
  flex: 0 0 auto;
  background: var(--color-surface);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  display: grid;
  place-items: center;
  padding: 8px;
}

.card-illustration img {
  height: 280px;
  width: auto;
  max-width: 520px;
  object-fit: contain;
  display: block;
  background-color: var(--color-surface);
}

@media (max-width: 980px) {
  .card-illustration img {
    height: 280px;
  }
}

@media (max-width: 600px) {
  .card-illustration img {
    height: 240px;
  }
}

/* CTA “Scopri di più” */
.cta-see-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
  font-family: var(--font-body);
  text-decoration: none;
  color: var(--color-accent);
  opacity: 0.9;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
  margin-top: 80px;
  white-space: nowrap;
}

.cta-see-all:hover {
  color: var(--color-hover);
}

.cta-see-all .icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: block;
}

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
</style>