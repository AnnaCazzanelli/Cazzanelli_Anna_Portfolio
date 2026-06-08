<script setup>
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import CtaSection from './components/CtaSection.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
</script>

<template>
  <a href="#main-content" class="skip-link">
    Salta al contenuto principale
  </a>
  <div class="app-wrapper">
    <header>
      <Navbar />
    </header>

    <RouterView />

    <template v-if="route.name !== 'contacts'">
      <CtaSection />
    </template>

    <footer class="footer-global-wrapper">
      <Footer />
    </footer>
  </div>
</template>

<style>
/* ==========================================================================
   Stile per lo Skip Link (Accessibilità tastiera)
   - Invisibile di base (spinto fuori dallo schermo in alto)
   - Diventa visibile solo quando riceve il focus tramite il tasto TAB
   ========================================================================== */
.skip-link {
  position: absolute;
  top: -100px;
  /* Spinge il link sopra e fuori dallo schermo */
  left: 20px;
  background-color: var(--color-accent, #000);
  /* Usa il tuo colore d'accento brand */
  color: var(--color-surface, #fff);
  /* Testo chiaro sullo sfondo d'accento */
  padding: 12px 24px;
  z-index: 9999;
  /* Garantisce che stia sopra a loghi, navbar o canvas */
  font-weight: 700;
  font-family: var(--font-body), sans-serif;
  text-decoration: none;
  border: 1px solid var(--color-accent);
  transition: top 0.2s ease;
}

/* Si attiva e scende visibilmente solo al passaggio del focus (TAB) */
.skip-link:focus {
  top: 20px;
  /* Fa scendere il rettangolo nello schermo */
  outline: 3px solid var(--color-text, #000);
  outline-offset: 3px;
}
</style>