<script setup>
/* ==========================================================================
   Import e configurazione
   ========================================================================== */
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
// Aggiunto RouterLink per il collegamento
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
  <main class="page-content" aria-labelledby="page-title">
    <div class="publications-page-wrapper flex flex-col items-center py-4">

      <section class="hero-container relative w-full overflow-hidden">
        <div class="hero-image-container absolute inset-0" aria-hidden="true"></div>
        <div class="header-content-wrapper absolute inset-x-0 top-1/2 -translate-y-1/2 text-center w-full px-[var(--margin-desktop)]">
          <h1 id="page-title">Pubblicazioni</h1>
        </div>
      </section>

      <section class="content-wrapper w-full max-w-[1200px] px-[var(--margin-desktop)] mt-12 mb-20">
        
        <div v-if="loading" class="text-center py-20 opacity-50">
          Caricamento...
        </div>

        <div v-else-if="publications.length" class="pub-grid grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 justify-items-center">
          <RouterLink 
            v-for="pub in publications" 
            :key="pub.id" 
            :to="{ name: 'publication-details', params: { id: pub.id }}"
            class="pub-card group w-full max-w-[380px] no-underline block"
          >
            <div class="cover-container overflow-hidden mb-6 shadow-md transition-transform duration-500 group-hover:scale-[1.01]">
              <img 
                :src="pub.main_image" 
                :alt="pub.title" 
                class="w-full h-full object-cover aspect-[569/800]" 
              />
            </div>
            
            <div class="text-center px-4">
                <h3 class="title mt-4 mb-2">{{ pub.title }}</h3>
              <p class="pub-info">{{ pub.publisher }} , {{ pub.date }}</p>
            </div>
          </RouterLink>
        </div>

        <div v-else class="text-center py-20 opacity-40">
          Nessuna pubblicazione trovata.
        </div>
      </section>

    </div>
  </main>
</template>

<style scoped>
/* ==========================================================================
   STILI HERO (Invariati per Darkmode)
   ========================================================================== */
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



/* ==========================================================================
   STILI GRIGLIA & CARDS
   ========================================================================== */
.pub-card {
  text-decoration: none;
}

.cover-container {
  box-shadow: 0 1px 2px rgba(var(--text-rgb) / 0.20), 0 8px 20px rgba(var(--text-rgb) / 0.12);
}

.pub-date {
  /* Assicura leggibilità minima senza sminchiare darkmode */
  letter-spacing: 0.05em;
}

.pub-info {
  /* Colore pieno come richiesto */
  color: var(--color-text);
  /* Dimensioni ridotte rispetto al payoff standard */
  font-size: clamp(13px, 1.1vw, 15px); 
  line-height: 1.5;
  font-weight: 500;
  /* Rimosso opacity-50 per evitare l'effetto sfumato */
  opacity: 1; 
  margin-top: 4px;
}

.title {
  color: var(--color-accent);
  font-family: var(--font-display);
  font-weight: bold;
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
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
    font-size: 28pt; 
    line-height: 1.2;
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