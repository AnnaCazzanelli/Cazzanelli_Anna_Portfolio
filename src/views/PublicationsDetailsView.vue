<script setup>
/* ==========================================================================
   Import e routing
   ========================================================================= */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { db } from '@/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

/* ==========================================================================
   Stato view
   ========================================================================= */
const route = useRoute()
const pub = ref(null)
const loading = ref(true)
const notFound = ref(false)
const activeIndex = ref(0)

/* ==========================================================================
   Helpers di Pulizia (Risolvono gli errori di battitura nel DB)
   ========================================================================= */
const cleanPath = (path) => {
  if (!path || typeof path !== 'string') return ''
  let cleaned = path.replace(/\s/g, '').trim()
  if (cleaned.endsWith('.web')) cleaned += 'p'
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned
  return cleaned
}

const normKey = (u) => {
  if (typeof u !== 'string') return ''
  const clean = cleanPath(u).toLowerCase().split('?')[0]
  return clean.split('/').pop() || ''
}

/* Scroll iniziale */
window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

/* ==========================================================================
   Normalizzazione Gallery (Prende SOLO la alta risoluzione dalla gallery)
   ========================================================================= */
const images = computed(() => {
  if (!pub.value) return []
  const out = []
  const addedKeys = new Set()

  if (Array.isArray(pub.value.gallery)) {
    pub.value.gallery.forEach((item) => {
      let src = ""
      if (typeof item === 'string') {
        src = cleanPath(item)
      } else if (item && typeof item === 'object') {
        src = cleanPath(item.high_res || item.hig_res || item.low_res)
      }

      if (src) {
        const currentKey = normKey(src)
        if (!addedKeys.has(currentKey)) {
          out.push({ src, alt: `${pub.value.title} – immagine` })
          addedKeys.add(currentKey)
        }
      }
    })
  }
  return out
})

const thumbs = computed(() => images.value)

/* ==========================================================================
   Navigazione
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
   Fetch dati
   ========================================================================= */
async function fetchPublication() {
  loading.value = true
  notFound.value = false
  const id = String(route.params.id || '').trim()
  try {
    const snap = await getDoc(doc(db, 'publications', id))
    if (!snap.exists()) { notFound.value = true; return }
    pub.value = { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error("Errore fetch:", e)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchPublication)
watch(() => route.params.id, fetchPublication)
</script>

<template>
  <main id="main-content" tabindex="-1" class="page bg-surface text-text">

    <div v-if="loading" class="loading py-40 text-center opacity-80 uppercase tracking-widest" role="status"
      aria-live="polite">Caricamento…</div>

    <div v-else-if="notFound" class="notfound py-40 text-center opacity-80" role="alert">
      <p class="mb-4">Pubblicazione non trovata.</p>
      <RouterLink to="/publications" class="text-accent underline">Torna alla lista</RouterLink>
    </div>

    <div v-else-if="pub" class="container max-w-[1200px] mx-auto relative">

      <RouterLink to="/publications"
        class="back-btn absolute -top-[60px] left-0 w-12 h-12 flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Torna alla lista delle pubblicazioni">
        <img src="/icone/icon-arrowsx.svg" alt="" aria-hidden="true" class="icon w-6 h-6" />
        <span class="sr-only">Torna alla lista delle pubblicazioni</span>
      </RouterLink>

      <h1 class="title text-accent text-center">{{ pub.title }}</h1>

      <section class="viewer grid grid-cols-[48px_1fr_48px] items-center gap-6 mb-14"
        aria-label="Visualizzatore elementi della pubblicazione">

        <button
          class="nav w-12 h-12 bg-transparent inline-flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent"
          :disabled="activeIndex === 0" @click="prev" aria-label="Elemento precedente" title="Elemento precedente">
          <img src="/icone/icon-prev.svg" alt="" aria-hidden="true" class="w-6 h-6 block pointer-events-none" />
        </button>

        <div class="stage bg-surface grid place-items-center overflow-hidden">
          <img v-if="images.length > 0" :src="images[activeIndex].src" :alt="images[activeIndex].alt"
            class="stage-img block shadow-2xl object-contain" />
          <div v-else class="opacity-20 italic" role="status">Contenuto multimediale non disponibile</div>
        </div>

        <button
          class="nav w-12 h-12 bg-transparent inline-flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/10 hover:scale-105 active:scale-95 disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-transparent"
          :disabled="activeIndex === images.length - 1" @click="next" aria-label="Elemento successivo"
          title="Elemento successivo">
          <img src="/icone/icon-next.svg" alt="" aria-hidden="true" class="icon w-6 h-6 block pointer-events-none" />
        </button>

      </section>

      <section v-if="thumbs.length > 1" class="thumbs flex gap-4 overflow-x-auto scroll-smooth no-scrollbar mb-14 px-20"
        role="list" aria-label="Miniature della pubblicazione">
        <button v-for="(t, i) in thumbs" :key="t.src + i" class="thumb flex-shrink-0"
          :class="{ 'active': i === activeIndex }" @click="setActive(i)" :aria-label="'Mostra elemento ' + (i + 1)"
          :title="'Mostra elemento ' + (i + 1)" :aria-current="i === activeIndex ? 'true' : 'false'" role="listitem">
          <img :src="t.src" :alt="t.alt" class="w-full h-full object-cover pointer-events-none" />
        </button>
      </section>

      <section
        class="meta grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 pt-10 border-t border-black/5 dark:border-white/5"
        aria-label="Scheda dettagli pubblicazione">
        <div class="col">

          <dl class="meta-list">
            <dt v-if="pub.date" class="meta-label">Anno</dt>
            <dd v-if="pub.date">
              <p class="desc">{{ pub.date }}</p>
            </dd>

            <dt v-if="pub.publisher" class="meta-label">Editore</dt>
            <dd v-if="pub.publisher">
              <p class="desc">{{ pub.publisher }}</p>
            </dd>

            <dt v-if="pub.author" class="meta-label">Autore</dt>
            <dd v-if="pub.author">
              <p class="desc">{{ pub.author }}</p>
            </dd>
          </dl>
        </div>

        <div class="col">
          <h2 class="meta-label">Descrizione</h2>
          <div class="desc leading-relaxed" v-html="pub.description"></div>
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

.page {
  padding: 48px var(--margin-desktop) 112px;
}

.title {
  font-size: clamp(2rem, 4.2vw, 3.5rem);
  line-height: 1.1;
  margin: 56px 0 48px;
  font-family: var(--font-display);
  font-weight: bold;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.nav {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
}

.nav:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05) !important;
  border-radius: 8px;
  transform: scale(1.05);
}

:global(.dark) .nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1) !important;
}

.nav:disabled {
  opacity: 0.1;
  cursor: not-allowed;
}

.stage {
  min-height: clamp(31.25rem, 70vh, 50rem);
  width: 100%;
}

.stage-img {
  height: clamp(31.25rem, 70vh, 50rem);
  width: auto;
}

.thumb {
  width: 80px;
  height: 112px;
  border-radius: 4px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: block;
  border: 2px solid rgba(var(--text-rgb), 0.15) !important;
  opacity: 0.6;
  transition: opacity 0.2s ease !important;
}

.thumb.active {
  border-color: var(--color-accent) !important;
  opacity: 100 !important;
  transition: none !important;
}

/* UNIFICATO: Regola lo stile di tutti i testi di descrizione e dei valori tecnici a sinistra */
.desc,
.meta-list dd p {
  font-size: clamp(0.93rem, 1.05vw, 1.12rem);
    line-height: 1.8;
    margin: 0 0 14px;
}

.meta-list {
  margin: 0;
  padding: 0;
}

/* BLINDATO CON LE TUE SPECIFICHE: Sincronizzato con l'aspetto di Illustration e Project Detail */
.meta-label {
  font-size: clamp(1.25rem, 1.9vw, 1.5rem);
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-style: normal;
  font-weight: 700;
  color: var(--color-accent);
  display: block;
}

@media (max-width: 768px) {
  .page {
    padding: 32px var(--margin-mobile) 80px;
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

  .stage {
    min-height: 28.125rem;
  }

  .stage-img {
    height: 28.125rem;
  }

  .meta {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .thumbs {
    padding-inline: 4px;
    justify-content: flex-start;
  }
}
</style>