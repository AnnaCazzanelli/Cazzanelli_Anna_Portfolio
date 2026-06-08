<script setup>
/* ==========================================================================
   Import e configurazione
   ========================================================================== */
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { RouterLink } from 'vue-router'

const publications = ref([])
const loading = ref(true)

async function fetchPublications() {
  loading.value = true
  try {
    const q = query(
      collection(db, 'publications'),
      orderBy('priority', 'asc')
    )
    const snap = await getDocs(q)
    publications.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (e) {
    console.error("Errore Firebase:", e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  fetchPublications()
})
</script>

<template>
  <main class="page-content">
    <div class="publications-page-wrapper flex flex-col items-center py-4">

      <section class="hero-container relative w-full overflow-hidden" role="region" aria-labelledby="page-title">
        <div class="hero-image-container absolute inset-0" aria-hidden="true"></div>
        <div
          class="header-content-wrapper absolute inset-x-0 top-1/2 -translate-y-1/2 text-center w-full px-[var(--margin-desktop)]">
          <h1 id="page-title">Pubblicazioni</h1>
        </div>
      </section>

      <section class="content-wrapper w-full max-w-[1200px] px-[var(--margin-desktop)] mt-12 mb-20" role="region"
        aria-labelledby="content-title">

        <h2 id="content-title" class="sr-only">Elenco delle pubblicazioni editoriali</h2>

        <div v-if="loading" class="text-center py-20 opacity-50" role="status" aria-live="polite">
          Caricamento...
        </div>

        <div v-else-if="publications.length"
          class="pub-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 justify-items-center" role="list"
          aria-label="Raccolta pubblicazioni">
          <RouterLink v-for="pub in publications" :key="pub.id"
          :to="`/publications/${pub.id}`"
            class="pub-card group w-full max-w-[380px] no-underline block"
            :aria-label="`Leggi i dettagli di: ${pub.title || 'Pubblicazione'}`" role="listitem">

            <div
              class="cover-container overflow-hidden mb-6 shadow-md transition-transform duration-500 group-hover:scale-[1.01]">
              <img :src="pub.main_image" :alt="pub.title ? `Copertina di: ${pub.title}` : 'Copertina pubblicazione'"
                class="w-full h-full object-cover aspect-[569/800]" />
            </div>

            <div class="text-center px-4">
              <h3 class="mt-4">{{ pub.title || 'Senza titolo' }}</h3>
              <p class="pub-info">
                <template v-if="pub.publisher">{{ pub.publisher }} &middot; </template>{{ pub.date }}
              </p>
            </div>
          </RouterLink>
        </div>

        <div v-else class="text-center py-20 opacity-40" role="alert">
          Nessuna pubblicazione trovata.
        </div>
      </section>

    </div>
  </main>
</template>

<style scoped>
/* --- HERO --- */
.hero-container {
  height: 350px;
  width: 100%;
  position: relative;
  background-color: transparent;
}

.hero-image-container {
  background-image: url('/images/pubblication/pubblication_lightmode1.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: right center;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: background-image 0.3s ease;
}

body.dark-mode .hero-image-container {
  background-image: url('/images/pubblication/pubblication_darkmode.png');
}

.header-content-wrapper {
  z-index: 2;
}

/* --- UTILS --- */
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

/* --- GRIGLIA & CARDS --- */
.pub-card {
  text-decoration: none;
}

.cover-container {
  box-shadow: 0 1px 2px rgba(var(--text-rgb) / 0.20), 0 8px 20px rgba(var(--text-rgb) / 0.12);
}

.pub-date {
  letter-spacing: 0.05em;
}

.pub-info {
  color: var(--color-text);
  font-size: clamp(13px, 1.1vw, 15px);
  line-height: 1.5;
  font-weight: 500;
  opacity: 1;
  margin-top: 4px;
}

.title {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-weight: bold;
}

/* --- RESPONSIVE --- */
@media (max-width: 768px) {
  .hero-container {
    height: auto;
    display: flex;
    flex-direction: column;
    padding-top: 20px;
  }

  .hero-image-container {
    position: relative;
    width: 100%;
    height: 250px;
    background-position: center;
    background-size: contain;
    margin-bottom: 10px;
  }

  .header-content-wrapper {
    position: relative;
    top: 0;
    transform: none;
    padding-inline: var(--margin-mobile);
    margin-bottom: 40px;
    text-align: center;
  }

  .header-content-wrapper h1 {
    font-size: 2.3rem;
    line-height: 2.8rem;
  }

  .content-wrapper {
    padding-inline: var(--margin-mobile);
    margin-top: 0;
  }

  .pub-grid {
    gap-y: 40px;
  }
}
</style>