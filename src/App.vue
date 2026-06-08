<script setup>
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import CtaSection from './components/CtaSection.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
</script>

<template>
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