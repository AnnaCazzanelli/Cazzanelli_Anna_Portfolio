<script setup>
/* ==========================================================================
   Import e Stato
   ========================================================================== */
import { ref, computed, onMounted, nextTick } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'

const { currentLang } = useLanguage()
const isEnglish = computed(() => currentLang.value === 'en')

const rawIllustrations = ref([])
const activeFilter = ref('All')

/* ==========================================================================
   Scroll iniziale e Mount
   ========================================================================== */
onMounted(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  getIllustrations()
})

/* ==========================================================================
   Configurazione Categorie e Colori
   ========================================================================== */
const CATEGORY_COLORS = {
  'Commissione': { bg: '#fff0f6', bd: '#ff85c0', fg: '#9e1068' },
  'Pubblicazioni': { bg: '#fff7e6', bd: '#ffa940', fg: '#ad4e00' },
  'Challenge Artistica': { bg: '#feffe6', bd: '#ffec3d', fg: '#856a00' },
  'Progetto Personale': { bg: '#ebfaf5', bd: '#20b2aa', fg: '#006660' },
  Other: { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

function normalizeRawCategory(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (s.includes('commission')) return 'Commissione'
  if (s.includes('pubbli') || s.includes('publicat')) return 'Pubblicazioni'
  if (s.includes('challenge')) return 'Challenge Artistica'
  if (s.includes('person')) return 'Progetto Personale'
  return 'Other'
}

function getLocalizedCategory(rawKey, en) {
  if (!en) return rawKey
  switch (rawKey) {
    case 'Commissione': return 'Commissioned Work'
    case 'Pubblicazioni': return 'Publications'
    case 'Challenge Artistica': return 'Art Challenge'
    case 'Progetto Personale': return 'Personal Project'
    default: return 'Other'
  }
}

/* Opzioni Filtri bilingue */
const filterOptions = computed(() => {
  if (isEnglish.value) {
    return [
      { key: 'All', label: 'All' },
      { key: 'Commissione', label: 'Commissioned Work' },
      { key: 'Pubblicazioni', label: 'Publications' },
      { key: 'Challenge Artistica', label: 'Art Challenge' },
      { key: 'Progetto Personale', label: 'Personal Project' }
    ]
  }
  return [
    { key: 'All', label: 'Tutte' },
    { key: 'Commissione', label: 'Commissione' },
    { key: 'Pubblicazioni', label: 'Pubblicazioni' },
    { key: 'Challenge Artistica', label: 'Challenge Artistica' },
    { key: 'Progetto Personale', label: 'Progetto Personale' }
  ]
})

/* ==========================================================================
   Dati Localizzati Reattivi (Titoli, Categorie e Tag ITA/ENG)
   ========================================================================== */
const illustrations = computed(() => {
  const en = isEnglish.value
  return rawIllustrations.value.map(item => {
    let localizedTags = item.tag || []
    if (en && Array.isArray(item.tag_en) && item.tag_en.length > 0) {
      localizedTags = item.tag_en
    }

    const rawCat = normalizeRawCategory(item.category)

    return {
      ...item,
      title: en ? (item.title_en || item.title) : item.title,
      category: getLocalizedCategory(rawCat, en),
      rawCategory: rawCat,
      tag: localizedTags
    }
  })
})

/* ==========================================================================
   Logica di Filtraggio e Stili
   ========================================================================== */
const filteredIllustrations = computed(() => {
  if (activeFilter.value === 'All') return illustrations.value
  return illustrations.value.filter(item => item.rawCategory === activeFilter.value)
})

function setFilter(filterKey) {
  activeFilter.value = filterKey
  nextTick(applyTilt)
}

function getFilterActiveStyle(key) {
  if (key === 'All') {
    return {
      backgroundColor: 'rgba(var(--accent-rgb), 0.15)',
      color: 'var(--color-accent)',
      boxShadow: '0 0 0 2px var(--color-accent)'
    }
  }
  const c = CATEGORY_COLORS[key] || CATEGORY_COLORS.Other
  return {
    backgroundColor: c.bg,
    color: c.fg,
    boxShadow: `0 0 0 2px ${c.bd}`
  }
}

function tagStyle(rawCategory) {
  const c = CATEGORY_COLORS[rawCategory] || CATEGORY_COLORS.Other
  return {
    background: c.bg,
    border: `1px solid ${c.bd}`,
    color: c.fg
  }
}

/* ==========================================================================
   Effetti, Accessibilità e Fetch
   ========================================================================== */
function applyTilt() {
  document.querySelectorAll('.illustration-item').forEach((el) => {
    const tilt = (Math.random() * 2.4 - 1.2).toFixed(2)
    el.style.setProperty('--tilt', `${tilt}deg`)
    el.style.setProperty('--hover-tilt', `${(parseFloat(tilt) + 1.2).toFixed(2)}deg`)
  })
}

async function getIllustrations() {
  try {
    const col = collection(db, 'illustrations')
    const q = query(col, orderBy('order', 'asc'))
    const rs = await getDocs(q)
    // ID Firestore posizionato alla fine per evitare sovrascritture da campi interni
    rawIllustrations.value = rs.docs.map(doc => ({ ...doc.data(), id: doc.id }))

    await nextTick()
    applyTilt()
  } catch (e) {
    console.error('Errore caricamento illustrazioni:', e)
  }
}

function ariaLabelFor(item) {
  const en = isEnglish.value
  const catText = item.category ? (en ? `. Category: ${item.category}` : `. Categoria: ${item.category}`) : ''
  const tags = Array.isArray(item.tag) && item.tag.length ? (en ? `. Tags: ${item.tag.join(', ')}.` : `. Tag: ${item.tag.join(', ')}.`) : ''
  return en
    ? `View illustration “${item.title}”${catText}${tags}`
    : `Apri l’illustrazione “${item.title}”${catText}${tags}`
}

function altFor(item) {
  return isEnglish.value
    ? `Illustration: ${item.title}`
    : `Illustrazione: ${item.title}`
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="page-content" aria-labelledby="page-title">
    <div class="illustrations-container flex flex-col items-center py-4">

      <!-- Hero Section -->
      <section class="hero-container relative w-full h-[400px] overflow-hidden" role="region"
        aria-labelledby="page-title">
        <div class="hero-image-container absolute inset-0" aria-hidden="true"></div>
        <div
          class="header-content-wrapper absolute inset-x-0 top-1/2 -translate-y-1/2 text-center w-full px-[var(--margin-desktop)]">
          <h1 id="page-title">{{ isEnglish ? 'Illustrations' : 'Illustrazioni' }}</h1>
        </div>
      </section>

      <!-- Sezione Filtri -->
      <section class="filters-section w-full max-w-[1400px] px-[var(--margin-desktop)] mt-2 mb-12 text-center"
        role="region" :aria-label="isEnglish ? 'Filters Section' : 'Sezione Filtri'">
        <p class="filters-cta payoff mt-2 mb-6 opacity-90">
          {{ isEnglish ? 'Filter by category' : 'Filtra per tipologia' }}
        </p>

        <div class="filters-scroll-wrapper">
          <div class="filters-wrapper" role="group"
            :aria-label="isEnglish ? 'Filter illustrations by category' : 'Filtri illustrazioni per categoria'">
            <button v-for="opt in filterOptions" :key="opt.key" @click="setFilter(opt.key)" class="filter-btn"
              :class="{ 'active': activeFilter === opt.key }"
              :style="activeFilter === opt.key ? getFilterActiveStyle(opt.key) : {}"
              :aria-pressed="activeFilter === opt.key"
              :aria-label="opt.key === 'All'
                ? (isEnglish ? 'Show all illustrations' : 'Mostra tutte le illustrazioni')
                : (isEnglish ? `Show only ${opt.label} illustrations` : `Mostra solo illustrazioni di categoria ${opt.label}`)">
              {{ opt.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Griglia Illustrazioni -->
      <section class="illustration-content-wrapper w-full max-w-[1400px]" role="region">
        <div class="illustration-grid grid gap-12 py-8" role="list">
          <RouterLink v-for="illustration in filteredIllustrations" :key="illustration.id"
            class="illustration-item flex flex-col items-center text-center no-underline outline-none"
            :to="`/illustrations/${illustration.id}`" :aria-label="ariaLabelFor(illustration)" role="listitem">
            <div class="media relative m-0">
              <img :src="illustration.img" :alt="altFor(illustration)" loading="lazy" class="block max-w-full h-auto" />
              <span class="cat-badge absolute top-2.5 left-2.5" :style="tagStyle(illustration.rawCategory)">
                {{ illustration.category }}
              </span>
            </div>

            <div class="illustration-details flex flex-col items-center">
              <h3 class="title mt-4 mb-2">{{ illustration.title }}</h3>

              <div v-if="illustration.tag?.length" class="illustration-tags flex flex-wrap justify-center gap-1.5 mt-2">
                <span v-for="tag in illustration.tag" :key="tag" class="tag"
                  :style="tagStyle(illustration.rawCategory)">
                  {{ tag }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
/* --- FILTRI --- */
.filters-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.filters-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  padding-block: 8px;
}

.filters-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.filters-wrapper {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.8rem;
  padding-inline: 20px;
  justify-content: center;
}

.filters-cta {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .filters-wrapper {
    justify-content: flex-start;
  }
}

.filter-btn {
  background: transparent;
  border: none;
  font-family: var(--font-body);
  color: var(--color-link);
  padding: 6px 14px;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.filter-btn.active {
  font-weight: 700;
}

/* --- HERO (DESKTOP) --- */
.hero-container {
  height: 350px;
}

.hero-image-container {
  background-image: url('/images/illustration/copertina/illustration_lightmode.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right center;
}

body.dark-mode .hero-image-container {
  background-image: url('/images/illustration/copertina/illustration_darkmode.png');
}

.header-content-wrapper h1 {
  font-size: 5.3rem;
  line-height: 1.1;
  color: var(--color-accent);
}

/* --- RESPONSIVE MOBILE --- */
@media (max-width: 768px) {
  .hero-container {
    height: auto;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .hero-image-container {
    position: relative;
    width: 100%;
    height: 250px;
    background-position: center;
    background-size: contain;
    margin-bottom: 20px;
    transform: none;
  }

  .header-content-wrapper {
    position: relative;
    top: 0;
    transform: none;
    padding-inline: var(--margin-mobile);
    margin-bottom: 40px;
  }

  .header-content-wrapper h1 {
    font-size: 2.3rem;
    line-height: 1.2;
  }

  .filters-wrapper {
    justify-content: flex-start;
  }
}

/* --- GRID --- */
.illustration-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-flow: dense;
}

@media (min-width: 1200px) {

  .illustration-grid>.illustration-item:nth-child(8n + 1),
  .illustration-grid>.illustration-item:nth-child(8n + 5) {
    grid-column: span 2;
  }
}

@media (max-width: 1199px) and (min-width: 769px) {
  .illustration-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .illustration-grid>.illustration-item:nth-child(6n + 1) {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .illustration-grid {
    grid-template-columns: 1fr;
  }
}

/* --- CARD EFFECTS --- */
.illustration-item {
  --tilt: 0deg;
  --hover-tilt: 0deg;
  --lift: 8px;
  will-change: transform;
}

.media {
  transform: rotate(var(--tilt));
  transition: transform 220ms ease, filter 220ms ease;
}

.media img {
  border: 1px solid rgba(var(--text-rgb) / 0.12);
  box-shadow: 0 1px 2px rgba(var(--text-rgb) / 0.20), 0 8px 20px rgba(var(--text-rgb) / 0.12);
}

.cat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border: 1px solid currentColor;
  border-radius: 9999px;
  line-height: normal;
  font-size: 0.95rem;
  font-weight: var(--font-weight-semibold);
}

.illustration-item:hover .media,
.illustration-item:focus-visible .media {
  transform: rotate(var(--hover-tilt)) translateY(calc(-1 * var(--lift))) scale(1.02);
  filter: contrast(1.03) saturate(1.02);
}

@media (max-width: 768px) {
  .media {
    transform: none !important;
  }

  .illustration-item:hover .media {
    transform: none !important;
  }
}

.title {
  font-size: 1.5rem;
  line-height: 1.5;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border: 1px solid currentColor;
  border-radius: 9999px;
  line-height: normal;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
}
</style>