<script setup>
/* ==========================================================================
   Import e Stato
   ========================================================================== */
import { ref, computed, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'

const { currentLang } = useLanguage()

const rawProjects = ref([])
const loading = ref(true)
const error = ref(null)
const activeFilter = ref('All')

/* ==========================================================================
   Scroll iniziale
   ========================================================================== */
onMounted(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  getProjects()
})

/* ==========================================================================
   Configurazione Categorie e Colori
   ========================================================================= */
const CATEGORY_COLORS = {
  'Motion Graphics': { bg: '#fff3bf', bd: '#ffd43b', fg: '#7a5b00' },
  'Web Design': { bg: '#e7f5ff', bd: '#74c0fc', fg: '#1c4f80' },
  'Communication': { bg: '#ffe3e3', bd: '#ffa8a8', fg: '#7a1f1f' },
  'Case Studies': { bg: '#e6f4ea', bd: '#81c995', fg: '#137333' },
  'Visual Design': { bg: '#ffe3f4', bd: '#ffa8dc', fg: '#7a1f5d' },
  Other: { bg: '#f1f3f5', bd: '#dee2e6', fg: '#212529' }
}

const filterOptions = ['All', 'Case Studies', 'Web Design', 'Visual Design', 'Communication', 'Motion Graphics']

/* ==========================================================================
   Dati Localizzati Reattivi (Titoli, Categorie e Tag ITA/ENG)
   ========================================================================= */
const isEnglish = computed(() => currentLang.value === 'en')

const projects = computed(() => {
  const en = isEnglish.value
  return rawProjects.value.map(p => {
    // Gestione Tag: se in inglese usa tag_en (se presente e non vuoto), altrimenti ripiega su tag
    let localizedTags = p.tag || []
    if (en && Array.isArray(p.tag_en) && p.tag_en.length > 0) {
      localizedTags = p.tag_en
    }

    return {
      ...p,
      title: en ? (p.title_en || p.title) : p.title,
      category: en ? (p.category_en || p.category) : p.category,
      rawCategory: (p.category || 'Other').trim(), // Mantenuto per il filtro uniforme
      tag: localizedTags
    }
  })
})

/* ==========================================================================
   Logica di Filtraggio e Stili
   ========================================================================= */
const filteredProjects = computed(() => {
  if (activeFilter.value === 'All') return projects.value
  return projects.value.filter(
    p => p.rawCategory.toLowerCase() === activeFilter.value.toLowerCase()
  )
})

function setFilter(filter) {
  activeFilter.value = filter
}

function getFilterActiveStyle(category) {
  if (category === 'All') {
    return {
      backgroundColor: 'rgba(var(--accent-rgb), 0.15)',
      color: 'var(--color-accent)',
      boxShadow: '0 0 0 2px var(--color-accent)'
    }
  }
  const c = CATEGORY_COLORS[category]
  if (!c) return {}
  return {
    backgroundColor: c.bg,
    color: c.fg,
    boxShadow: `0 0 0 2px ${c.bd}`
  }
}

function badgeStyle(category) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
  return {
    background: c.bg,
    border: `1px solid ${c.bd}`,
    color: c.fg
  }
}

/* ==========================================================================
   Accessibilità e Fetch
   ========================================================================= */
function ariaLabelFor(p) {
  const cat = p.category || (isEnglish.value ? 'Unspecified category' : 'Categoria non specificata')
  const tags = Array.isArray(p.tag) && p.tag.length ? `. Tag: ${p.tag.join(', ')}.` : ''
  return isEnglish.value
    ? `Open project “${p.title}”. Category: ${cat}${tags}`
    : `Apri il progetto “${p.title}”. Categoria: ${cat}${tags}`
}

function altFor(p) {
  return isEnglish.value
    ? `Cover image of project “${p.title}”`
    : `Immagine di copertina del progetto “${p.title}”`
}

async function getProjects() {
  loading.value = true
  error.value = null
  try {
    const q = query(collection(db, 'projects'), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    rawProjects.value = snap.docs
      .map(d => ({
        firestoreId: d.id,
        ...(d.data() || {})
      }))
      // Esclude i progetti bozza (nasconde solo se published è esplicitamente false)
      .filter(p => p.published !== false)
  } catch (e) {
    error.value = isEnglish.value ? 'Unable to load projects.' : 'Impossibile caricare i progetti.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main id="main-content" tabindex="-1" class="page-content" aria-labelledby="page-title">
    <div class="projects-container flex flex-col items-center py-4">

      <section class="hero-container relative w-full overflow-hidden" role="region" aria-labelledby="page-title">
        <div class="hero-image-container absolute inset-0" aria-hidden="true"></div>
        <div
          class="header-content-wrapper absolute inset-x-0 top-1/2 -translate-y-1/2 text-center w-full px-[var(--margin-desktop)]">
          <h1 id="page-title">{{ isEnglish ? 'Digital Projects' : 'Progetti Digitali' }}</h1>
        </div>
      </section>

      <section class="filters-section w-full max-w-[1400px] px-[var(--margin-desktop)] mt-12 mb-16 text-center"
        role="region" :aria-label="isEnglish ? 'Filters Section' : 'Sezione Filtri'">
        <p class="filters-cta payoff mt-2 mb-6 opacity-90">
          {{ isEnglish ? 'Choose your area of interest' : "Scegli l'ambito di tuo interesse" }}
        </p>
        <div class="filters-scroll-wrapper">
          <div class="filters-wrapper" role="group"
            :aria-label="isEnglish ? 'Filter projects by category' : 'Filtri progetti per ambito'">
            <button v-for="cat in filterOptions" :key="cat" @click="setFilter(cat)" class="filter-btn"
              :class="{ 'active': activeFilter === cat }" :style="activeFilter === cat ? getFilterActiveStyle(cat) : {}"
              :aria-pressed="activeFilter === cat" :aria-label="cat === 'All'
                ? (isEnglish ? 'Show all projects' : 'Mostra tutti i progetti')
                : (isEnglish ? `Show ${cat} projects` : `Mostra progetti dell'ambito ${cat}`)">
              {{ cat === 'All' ? (isEnglish ? 'All Projects' : 'Tutti i progetti') : cat }}
            </button>
          </div>
        </div>
      </section>

      <p v-if="error" class="text-[#d00] my-2" role="alert">{{ error }}</p>

      <section v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 max-w-[1400px] w-full mt-0 mb-12 px-[var(--margin-desktop)]"
        role="status" aria-live="polite" :aria-label="isEnglish ? 'Loading projects' : 'Caricamento progetti'">
        <div v-for="n in 4" :key="n" class="project-item skeleton flex flex-col items-center">
          <div class="relative w-full aspect-[1200/800] bg-[var(--color-surface)] skeleton-box"></div>
          <div class="skeleton-line title"></div>
        </div>
      </section>

      <section v-else
        class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-20 max-w-[1400px] w-full mt-0 mb-12 px-[var(--margin-desktop)]"
        role="list">
        <RouterLink v-for="p in filteredProjects" :key="p.firestoreId"
          class="project-item no-underline text-inherit flex flex-col items-center text-center cursor-pointer outline-none"
          :to="`/projects/${p.firestoreId}`" :aria-label="ariaLabelFor(p)" role="listitem">

          <div class="relative w-full aspect-[1200/800] overflow-hidden bg-[var(--color-surface)] m-0">
            <img :src="p.img" :alt="altFor(p)" class="w-full h-full object-cover transition-transform duration-200" />
            <span class="cat-badge" :style="badgeStyle(p.rawCategory)">
              {{ p.category || 'Other' }}
            </span>
          </div>

          <h3 class="mt-4">{{ p.title }}</h3>
          <ul v-if="p.tag?.length" class="list-none flex flex-wrap justify-center mt-2 gap-2 p-0"
            :aria-label="isEnglish ? 'Project tags' : 'Tag di progetto'">
            <li v-for="tag in p.tag" :key="tag" class="tag pill" :style="badgeStyle(p.rawCategory)">
              {{ tag }}
            </li>
          </ul>
        </RouterLink>
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

.filters-cta {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 1.1rem;
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
  justify-content: center;
  gap: 0.8rem;
  padding-inline: 10px;
}

.filter-btn {
  background: transparent;
  border: none;
  font-family: var(--font-body);
  color: var(--color-link);
  font-size: 1rem;
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
  background-image: url('/images/projects/copertina/project_lightmode.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right center;
}

body.dark-mode .hero-image-container {
  background-image: url('/images/projects/copertina/project_darkmode.png');
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

/* --- CARDS & PILLS --- */
.cat-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: var(--font-weight-semibold);
  line-height: normal;
  border: 1px solid currentColor;
  z-index: 10;
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
  line-height: normal;
}

/* --- UTILS --- */
@keyframes pulse {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 0.3;
  }

  100% {
    opacity: 0.6;
  }
}

.skeleton-box {
  background: currentColor;
  opacity: 0.1;
  animation: pulse 1.6s infinite;
}

.sr-only {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>