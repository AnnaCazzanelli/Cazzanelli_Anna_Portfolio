<script setup>
/* ==========================================================================
   Import e Stato
   ========================================================================== */
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { useLanguage } from '@/composables/useLanguage'

/* Lingua e Routing */
const { currentLang } = useLanguage()
const isEnglish = computed(() => currentLang.value === 'en')

const route = useRoute()
const rawIllustration = ref(null)
const loading = ref(true)
const notFound = ref(false)

/* Modale Mobile Info */
const showMobileInfo = ref(false)
let lastActiveElement = null

function openMobileInfo() {
  lastActiveElement = document.activeElement
  showMobileInfo.value = true
  document.documentElement.style.overflow = 'hidden'
}

function closeMobileInfo() {
  showMobileInfo.value = false
  document.documentElement.style.overflow = ''
  if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
    lastActiveElement.focus()
  }
}

function trapMobileInfoFocus(e) {
  if (!showMobileInfo.value) return
  if (e.key === 'Tab') {
    const modal = document.querySelector('.mobile-info-card')
    if (!modal) return
    const focusable = modal.querySelectorAll('button, a, [tabindex="0"]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === last) {
        first.focus()
        e.preventDefault()
      }
    }
  }
}

watch(showMobileInfo, async (newVal) => {
  if (newVal) {
    await nextTick()
    const closeBtn = document.querySelector('.mobile-info-close-btn')
    if (closeBtn) closeBtn.focus()
  }
})

/* Lightbox Ingrandimento Immagini */
const activeLightboxImage = ref(null)

function openLightbox(url) {
  if (!url) return
  activeLightboxImage.value = url
  document.documentElement.style.overflow = 'hidden'
}

function closeLightbox() {
  activeLightboxImage.value = null
  if (!showMobileInfo.value) {
    document.documentElement.style.overflow = ''
  }
}

/* Navigazione sequenziale tra illustrazioni */
const orderedIds = ref([])
const currentIndexInList = computed(() => {
  return orderedIds.value.indexOf(String(route.params.id || '').trim())
})

const nextIllustrationId = computed(() => {
  if (currentIndexInList.value !== -1 && currentIndexInList.value < orderedIds.value.length - 1) {
    return orderedIds.value[currentIndexInList.value + 1]
  }
  return null
})

/* ==========================================================================
   Configurazione Categorie, Colori e Normalizzazione
   ========================================================================== */
const CATEGORY_COLORS = {
  'commissione': { bg: '#fff0f6', bd: '#ff85c0', fg: '#9e1068' },
  'pubblicazioni': { bg: '#fff7e6', bd: '#ffa940', fg: '#ad4e00' },
  'challenge artistica': { bg: '#feffe6', bd: '#ffec3d', fg: '#856a00' },
  'progetto personale': { bg: '#ebfaf5', bd: '#20b2aa', fg: '#006660' },
  'other': { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

function normalizeRawCategory(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('commission')) return 'commissione'
  if (s.includes('pubbli') || s.includes('publicat')) return 'pubblicazioni'
  if (s.includes('challenge')) return 'challenge artistica'
  if (s.includes('person')) return 'progetto personale'
  return 'other'
}

function getLocalizedCategory(rawKey, en) {
  if (!en) {
    switch (rawKey) {
      case 'commissione': return 'Commissione'
      case 'pubblicazioni': return 'Pubblicazioni'
      case 'challenge artistica': return 'Challenge Artistica'
      case 'progetto personale': return 'Progetto Personale'
      default: return 'Other'
    }
  }
  switch (rawKey) {
    case 'commissione': return 'Commissioned Work'
    case 'pubblicazioni': return 'Publications'
    case 'challenge artistica': return 'Art Challenge'
    case 'progetto personale': return 'Personal Project'
    default: return 'Other'
  }
}

/* ==========================================================================
   Dati Illustrazione Localizzati Reattivi
   ========================================================================== */
const illustration = computed(() => {
  if (!rawIllustration.value) return null
  const d = rawIllustration.value
  const en = isEnglish.value

  let localizedTags = d.tag || []
  if (en && Array.isArray(d.tag_en) && d.tag_en.length > 0) {
    localizedTags = d.tag_en
  }

  const rawCat = normalizeRawCategory(d.category)

  return {
    ...d,
    title: en ? (d.title_en || d.title) : d.title,
    description: en ? (d.description_en || d.description) : d.description,
    category: getLocalizedCategory(rawCat, en),
    rawCategory: rawCat,
    tools: en ? (d.tools_en || d.tools) : d.tools,
    tag: localizedTags
  }
})

/* Elenco Media verticali */
const mediaItems = computed(() => {
  if (!rawIllustration.value) return []
  const d = rawIllustration.value
  const en = isEnglish.value

  if (Array.isArray(d.gallery) && d.gallery.length > 0) {
    return d.gallery
      .map((it) => {
        if (it && typeof it === 'object') {
          const hi = (it.high_res || it.img || '').trim()
          const lo = (it.low_res || '').trim()
          const caption = (en && it.caption_en ? it.caption_en : (it.caption || '')).trim()
          return { hi, lo: lo || hi, caption }
        }
        if (typeof it === 'string') {
          const s = it.trim()
          return { hi: s, lo: s, caption: '' }
        }
        return null
      })
      .filter((item) => item && item.hi)
  }

  if (d.img) {
    return [{
      hi: d.img,
      lo: d.img_low || d.img,
      caption: (en && d.caption_en ? d.caption_en : (d.caption || '')).trim()
    }]
  }

  return []
})

const tagStyle = computed(() => {
  const catNormalized = illustration.value?.rawCategory || 'other'
  const c = CATEGORY_COLORS[catNormalized] || CATEGORY_COLORS['other']
  return {
    background: c.bg,
    borderColor: c.bd,
    color: c.fg
  }
})

/* ==========================================================================
   Fetch Dati Firestore
   ========================================================================== */
async function fetchIllustrationData() {
  loading.value = true
  notFound.value = false
  rawIllustration.value = null
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  const id = String(route.params.id || '').trim()

  if (!id) {
    notFound.value = true
    loading.value = false
    return
  }

  try {
    const snap = await getDoc(doc(db, 'illustrations', id))
    if (!snap.exists()) {
      notFound.value = true
      return
    }
    rawIllustration.value = { ...snap.data(), id: snap.id }

    if (orderedIds.value.length === 0) {
      const colRef = collection(db, 'illustrations')
      const q = query(colRef, orderBy('order', 'asc'))
      const listSnap = await getDocs(q)
      const ids = []
      listSnap.forEach((docSnap) => ids.push(docSnap.id))
      orderedIds.value = ids
    }
  } catch (e) {
    console.error('Errore nel recupero illustrazione:', e)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchIllustrationData()
  window.addEventListener('keydown', (ev) => {
    if (showMobileInfo.value && ev.key === 'Escape') closeMobileInfo()
    if (showMobileInfo.value) trapMobileInfoFocus(ev)
    if (activeLightboxImage.value && ev.key === 'Escape') closeLightbox()
  })
})

watch(() => route.params.id, fetchIllustrationData)
</script>

<template>
  <main id="main-content" tabindex="-1" class="page bg-surface text-text">
    <div v-if="loading" class="loading py-40 text-center opacity-80" role="status" aria-live="polite">
      {{ isEnglish ? 'Loading illustration…' : 'Caricamento illustrazione…' }}
    </div>

    <div v-else-if="notFound" class="notfound py-40 text-center opacity-80" role="alert">
      <p class="desc text-center">{{ isEnglish ? 'Illustration not found.' : 'Illustrazione non trovata.' }}</p>
      <RouterLink to="/illustrations" class="back-link text-accent no-underline font-semibold hover:underline">
        {{ isEnglish ? 'Back to illustrations' : 'Torna alle illustrazioni' }}
      </RouterLink>
    </div>

    <div v-else-if="illustration" class="illustration-container mx-auto relative">

      <!-- Barra di Navigazione in Alto: Sx (Torna indietro) | Dx (Successiva) -->
      <div class="top-nav-bar flex justify-between items-center w-full px-4 md:px-0 mb-8">
        <RouterLink to="/illustrations"
          class="back-btn w-12 h-12 inline-flex items-center justify-center bg-transparent"
          :aria-label="isEnglish ? 'Back to illustrations list' : 'Torna alla lista illustrazioni'"
          :title="isEnglish ? 'Back to illustrations list' : 'Torna alla lista illustrazioni'">
          <img src="/icone/icon-arrowsx.svg" alt="" aria-hidden="true" class="w-6 h-6 block" />
          <span class="sr-only">{{ isEnglish ? 'Back to illustrations list' : 'Torna alla lista illustrazioni' }}</span>
        </RouterLink>

        <RouterLink v-if="nextIllustrationId" :to="{ name: 'illustration-details', params: { id: nextIllustrationId } }"
          class="next-illustration-btn class-link w-12 h-12 inline-flex items-center justify-center bg-transparent"
          :aria-label="isEnglish ? 'Go to next illustration' : 'Vai all’illustrazione successiva'"
          :title="isEnglish ? 'Go to next illustration' : 'Vai all’illustrazione successiva'">
          <img src="/icone/icon-arrowdx.svg" alt="" aria-hidden="true" class="w-6 h-6 block" />
          <span class="sr-only">{{ isEnglish ? 'Next illustration' : 'Illustrazione successiva' }}</span>
        </RouterLink>
      </div>

      <!-- Header Principale & Meta Desktop Orizzontale -->
      <header class="illustration-header text-center">
        <h1 class="title text-accent text-center">{{ illustration.title }}</h1>

        <div
          class="illustration-top-meta-desktop hidden md:flex flex-wrap justify-center items-baseline gap-x-8 gap-y-2 mb-14">
          <div v-if="illustration.year" class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">{{ isEnglish ? 'Year:' : 'Anno:' }}</span>
            <span class="desc-text">{{ illustration.year }}</span>
          </div>

          <div class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">{{ isEnglish ? 'Category:' : 'Categoria:' }}</span>
            <span>
              <span class="pill" :style="tagStyle">{{ illustration.category || 'Other' }}</span>
            </span>
          </div>

          <div v-if="illustration.tools" class="meta-inline-item-top">
            <span class="meta-label inline-version font-bold">{{ isEnglish ? 'Medium & Tools:' : 'Tecnica (Tools):'
              }}</span>
            <span class="desc-text">{{ illustration.tools }}</span>
          </div>
        </div>
      </header>

      <!-- Galleria Illustrazioni con altezza proporzionata -->
      <section class="showcase-section w-full mb-14 flex flex-col items-center gap-8"
        :aria-label="isEnglish ? 'Illustration showcase gallery' : 'Galleria opere dell’illustrazione'">
        <div v-for="(media, index) in mediaItems" :key="index" class="showcase-item w-full flex flex-col items-center">
          <div class="stage grid place-items-center w-full cursor-zoom-in" @click="openLightbox(media.hi)">
            <picture class="inline-flex justify-center max-w-full">
              <source media="(max-width: 768px)" :srcset="media.lo" />
              <img :src="media.hi" :alt="`${illustration.title} - ${isEnglish ? 'Detail' : 'Dettaglio'} ${index + 1}`"
                class="stage-img block w-auto max-w-full" loading="lazy" />
            </picture>
          </div>

          <p v-if="media.caption" class="desc px-4 italic placeholder-caption-style">
            {{ media.caption }}
          </p>
        </div>
      </section>

      <!-- Sezione Dettagli (Descrizione a Sx, Scheda tecnica a Dx su Desktop / Layout Responsive su Mobile) -->
      <section class="meta grid gap-12 lg:gap-20 mt-4 px-4 md:px-0"
        :aria-label="isEnglish ? 'Illustration details and specifications' : 'Dettagli e specifiche dell’illustrazione'">
        <!-- Vista Mobile -->
        <div class="mobile-summary md:hidden flex flex-col gap-6 w-full">
          <div v-if="illustration.year" class="mobile-meta-block">
            <div class="meta-label">{{ isEnglish ? 'Year:' : 'Anno:' }}</div>
            <p class="desc m-0">{{ illustration.year }}</p>
          </div>

          <div class="mobile-meta-block">
            <div class="meta-label">{{ isEnglish ? 'Category:' : 'Categoria:' }}</div>
            <p class="m-0"><span class="pill" :style="tagStyle">{{ illustration.category || 'Other' }}</span></p>
          </div>

          <div class="mobile-meta-block mt-2">
            <h2 class="meta-label section-heading-style">{{ isEnglish ? 'Description' : 'Descrizione' }}</h2>
            <div v-if="illustration.description" class="illustration-description leading-relaxed mt-2"
              v-html="illustration.description"></div>
          </div>

          <button @click="openMobileInfo"
            class="mobile-trigger-info-btn text-left mt-2 border-t border-black/10 dark:border-white/10 pt-4 focus:outline-none"
            aria-haspopup="dialog">
            {{ isEnglish ? 'Show more details' : 'Mostra maggiori dettagli' }}
          </button>
        </div>

        <!-- Vista Desktop a 2 Colonne -->
        <div class="hidden md:contents">
          <!-- Colonna Sinistra: Descrizione -->
          <div class="col">
            <h2 class="meta-label section-heading-style">{{ isEnglish ? 'Description' : 'Descrizione' }}</h2>
            <div v-if="illustration.description" class="illustration-description leading-relaxed mt-4"
              v-html="illustration.description"></div>
          </div>

          <!-- Colonna Destra: Pannello Info & Scheda Tecnica -->
          <div class="info-meta-col h-fit">
            <div class="panel-header-wrapper">
              <h2 class="meta-label section-heading-style panel-border-bottom">{{ isEnglish ? 'Details' : 'Dettagli' }}
              </h2>
            </div>

            <dl class="meta-list flex flex-col gap-7 mt-6">
              <template v-if="illustration.year">
                <dt class="meta-label">{{ isEnglish ? 'Year:' : 'Anno:' }}</dt>
                <dd>
                  <p class="desc">{{ illustration.year }}</p>
                </dd>
              </template>

              <dt class="meta-label">{{ isEnglish ? 'Category:' : 'Categoria:' }}</dt>
              <dd class="mt-1">
                <span class="pill" :style="tagStyle">{{ illustration.category || 'Other' }}</span>
              </dd>

              <template v-if="illustration.tag?.length">
                <dt class="meta-label">{{ isEnglish ? 'Tags:' : 'Tag:' }}</dt>
                <dd>
                  <ul class="tags mt-1">
                    <li v-for="(t, i) in illustration.tag" :key="i" class="pill" :style="tagStyle">{{ t }}</li>
                  </ul>
                </dd>
              </template>

              <template v-if="illustration.tools">
                <dt class="meta-label">{{ isEnglish ? 'Medium & Tools:' : 'Tecnica (Tools):' }}</dt>
                <dd>
                  <p class="desc">{{ illustration.tools }}</p>
                </dd>
              </template>
            </dl>
          </div>
        </div>
      </section>

      <!-- Modale Mobile Info -->
      <div v-if="showMobileInfo" class="mobile-info-overlay fixed inset-0 z-[2000] flex items-end md:hidden"
        role="dialog" aria-modal="true">
        <div class="mobile-info-backdrop absolute inset-0 bg-black/60" @click="closeMobileInfo"></div>

        <div
          class="mobile-info-card relative w-full p-6 text-text border-t border-black/20 dark:border-white/20 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-y-auto">
          <div
            class="mobile-modal-top-bar flex justify-between items-center border-b border-black/10 dark:border-white/10 pb-3">
            <h2 class="meta-label section-heading-style m-0">{{ isEnglish ? 'Details' : 'Dettagli' }}</h2>
            <button @click="closeMobileInfo"
              class="mobile-info-close-btn flex items-center justify-center p-2 focus:outline-none"
              :aria-label="isEnglish ? 'Close information' : 'Chiudi informazioni'">
              <img src="/icone/icon-cross.svg" alt="" aria-hidden="true" class="w-4 h-4 block" />
            </button>
          </div>

          <dl class="meta-list flex flex-col gap-6 m-0">
            <dt class="meta-label">{{ isEnglish ? 'Category:' : 'Categoria:' }}</dt>
            <dd class="mt-1">
              <p><span class="pill" :style="tagStyle">{{ illustration.category || 'Other' }}</span></p>
            </dd>

            <template v-if="illustration.tag?.length">
              <dt class="meta-label">{{ isEnglish ? 'Tags:' : 'Tag:' }}</dt>
              <dd>
                <ul class="tags mt-1">
                  <li v-for="(t, i) in illustration.tag" :key="'mobtag-' + i" class="pill" :style="tagStyle">{{ t }}
                  </li>
                </ul>
              </dd>
            </template>

            <template v-if="illustration.tools">
              <dt class="meta-label">{{ isEnglish ? 'Medium & Tools:' : 'Tecnica (Tools):' }}</dt>
              <dd>
                <p class="desc">{{ illustration.tools }}</p>
              </dd>
            </template>
          </dl>
        </div>
      </div>

      <!-- Lightbox Schermo Intero -->
      <div v-if="activeLightboxImage"
        class="lightbox-overlay fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 p-4 md:p-8"
        @click="closeLightbox">
        <button
          class="lightbox-close-btn absolute top-6 right-6 bg-transparent border-0 w-12 h-12 flex items-center justify-center cursor-pointer transition-transform"
          @click.stop="closeLightbox"
          :aria-label="isEnglish ? 'Close full screen view' : 'Chiudi visualizzazione a schermo intero'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 svg-accent-icon"
            aria-hidden="true">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <div class="lightbox-content-wrapper max-w-full max-h-full flex items-center justify-center" @click.stop>
          <img :src="activeLightboxImage" :alt="isEnglish ? 'Zoomed detail artwork' : 'Dettaglio opera ingrandito'"
            class="lightbox-image max-w-full max-h-[90vh] object-contain select-none shadow-2xl" />
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
.sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.page {
  padding: 40px var(--margin-desktop) 120px;
}

.illustration-container {
  max-width: 1100px;
}

.title {
  font-size: clamp(2rem, 4.2vw, 4.6rem);
  line-height: 1.1;
  margin: 56px 0 40px;
}

.meta-inline-item-top {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
}

/* Immagine con altezza contenuta e proporzionata */
.stage {
  min-height: 380px;
  width: 100%;
}

.stage-img {
  height: clamp(22.5rem, 62vh, 45rem);
  max-height: 80vh;
  object-fit: contain;
  border: 1px solid rgba(var(--text-rgb) / 0.12);
  box-shadow: 0 1px 2px rgba(var(--text-rgb) / 0.20), 0 8px 20px rgba(var(--text-rgb) / 0.12);
}

.meta {
  grid-template-columns: 1.8fr 1fr;
  align-items: start;
}

.meta-label,
dt.meta-label {
  font-size: clamp(1.25rem, 1.9vw, 1.35rem) !important;
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
}

.mobile-meta-block .meta-label {
  margin: 0 0 6px;
}

h2.meta-label.section-heading-style {
  font-size: clamp(1.4rem, 2.3vw, 1.85rem) !important;
  margin: 0;
}

.desc,
.meta-list dd p {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
  line-height: 1.8;
  margin: 0 0 14px;
}

.placeholder-caption-style {
  text-align: left;
  margin-top: 1.25rem !important;
  width: 100%;
}

.illustration-description :deep(p) {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  white-space: pre-line;
}

.tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  list-style: none;
  padding: 0;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
}

.info-meta-col {
  background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border: 1px solid var(--color-accent);
  padding: 0;
}

.panel-header-wrapper {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 1.5rem;
}

.meta-list {
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
}

.panel-border-bottom {
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  padding-bottom: 0.75rem;
}

.mobile-info-card {
  background-color: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface, #fdfdfe));
}

:global(body.dark-mode) .mobile-info-card {
  background-color: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface, #111113));
}

.mobile-trigger-info-btn {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-link);
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

.back-btn img,
.next-illustration-btn img {
  transition: transform 0.22s ease;
}

.back-btn:hover img {
  transform: translateX(-4px);
}

.next-illustration-btn:hover img {
  transform: translateX(4px);
}

.svg-accent-icon {
  fill: var(--color-accent);
}

.lightbox-overlay {
  animation: fadeIn 0.2s ease-out;
}

.lightbox-image {
  animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .page {
    padding: 32px var(--margin-mobile) 96px;
  }

  .title {
    font-size: 2.2rem;
    margin: 40px 0 24px;
  }

  .stage {
    min-height: 18.75rem;
    padding: 8px 0;
  }

  .stage-img {
    width: 100%;
    height: auto;
    max-height: 70vh;
  }

  h2.meta-label.section-heading-style {
    font-size: 1.75rem !important;
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}
</style>